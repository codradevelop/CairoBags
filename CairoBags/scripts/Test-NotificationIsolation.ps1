#Requires -Version 5.1
<#
.SYNOPSIS
  Verifies notification APIs isolate data between customers (Customer A vs Customer B).

.DESCRIPTION
  1. Registers two unique customer accounts
  2. Inserts a notification for Customer A directly in SQL
  3. Asserts A can list/read it and B cannot (404 on cross-user mark-as-read)

  Prerequisites:
  - API running at $BaseUrl (default http://localhost:5073)
  - SQL Server with CairoBagsDb (see appsettings.Development.json)
  - Testing:DisableAuthorization MUST be false for meaningful auth checks

.PARAMETER BaseUrl
  API base URL without trailing slash.

.PARAMETER ConnectionString
  Optional SQL connection string. Defaults to local CairoBagsDb trusted connection.
#>
param(
    [string]$BaseUrl = "http://localhost:5073",
    [string]$ConnectionString = "Server=.;Database=CairoBagsDb;Trusted_Connection=True;TrustServerCertificate=True;"
)

$ErrorActionPreference = "Stop"
$suffix = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$password = "TestPass123!"

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [string]$Token = $null
    )
    $headers = @{ Accept = "application/json" }
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    $params = @{
        Uri = "$BaseUrl$Path"
        Method = $Method
        Headers = $headers
    }
    if ($Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 5)
    }
    try {
        return Invoke-RestMethod @params
    }
    catch {
        $resp = $_.Exception.Response
        if ($resp) {
            $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
            $text = $reader.ReadToEnd()
            return [PSCustomObject]@{
                StatusCode = [int]$resp.StatusCode
                Body = $text
                Error = $true
            }
        }
        throw
    }
}

Write-Host "=== Notification isolation test ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"

$userA = @{
    UserName = "notif_a_$suffix"
    Email = "notif_a_$suffix@test.local"
    PhoneNumber = "01000000001"
    Password = $password
}
$userB = @{
    UserName = "notif_b_$suffix"
    Email = "notif_b_$suffix@test.local"
    PhoneNumber = "01000000002"
    Password = $password
}

Write-Host "Registering Customer A..."
$regA = Invoke-Api -Method POST -Path "/api/Account/register" -Body $userA
if ($regA.Error) { throw "Register A failed: $($regA.Body)" }
$idA = $regA.id
$tokenA = $regA.token

Write-Host "Registering Customer B..."
$regB = Invoke-Api -Method POST -Path "/api/Account/register" -Body $userB
if ($regB.Error) { throw "Register B failed: $($regB.Body)" }
$idB = $regB.id
$tokenB = $regB.token

Write-Host "Inserting notification for Customer A (UserId=$idA)..."
Add-Type -AssemblyName System.Data
$conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
INSERT INTO Notifications (UserId, Title, Message, Type, CreatedAtUtc, IsRead, IsArchived, TargetType, TargetId)
OUTPUT INSERTED.Id
VALUES (@UserId, N'Test isolation', N'Only A should see this', 12, SYSUTCDATETIME(), 0, 0, N'System', NULL);
"@
$null = $cmd.Parameters.Add("@UserId", [System.Data.SqlDbType]::NVarChar, 450)
$cmd.Parameters["@UserId"].Value = $idA
$notificationId = [int]$cmd.ExecuteScalar()
$conn.Close()

Write-Host "Created notification Id=$notificationId"

Write-Host "Customer A lists notifications..."
$listA = Invoke-Api -Method GET -Path "/api/Notifications?page=1&pageSize=20" -Token $tokenA
$foundA = @($listA.items | Where-Object { $_.id -eq $notificationId })
if ($foundA.Count -ne 1) {
    throw "FAIL: Customer A should see notification $notificationId (found $($foundA.Count))"
}
Write-Host "PASS: Customer A sees the notification" -ForegroundColor Green

Write-Host "Customer B lists notifications..."
$listB = Invoke-Api -Method GET -Path "/api/Notifications?page=1&pageSize=20" -Token $tokenB
$foundB = @($listB.items | Where-Object { $_.id -eq $notificationId })
if ($foundB.Count -ne 0) {
    throw "FAIL: Customer B must NOT see notification $notificationId"
}
Write-Host "PASS: Customer B does not see A's notification" -ForegroundColor Green

Write-Host "Customer B tries mark-as-read on A's notification (expect 404)..."
$crossRead = Invoke-Api -Method POST -Path "/api/Notifications/read/$notificationId" -Token $tokenB
if (-not $crossRead.Error -or ($crossRead.StatusCode -ne 404 -and $crossRead.StatusCode -ne 403)) {
    throw "FAIL: Expected 404/403 for cross-user mark-as-read, got $($crossRead.StatusCode)"
}
Write-Host "PASS: Cross-user mark-as-read blocked ($($crossRead.StatusCode))" -ForegroundColor Green

Write-Host "Customer A marks notification as read..."
Invoke-Api -Method POST -Path "/api/Notifications/read/$notificationId" -Token $tokenA | Out-Null
$listAfter = Invoke-Api -Method GET -Path "/api/Notifications?page=1&pageSize=20" -Token $tokenA
$readRow = @($listAfter.items | Where-Object { $_.id -eq $notificationId })
if ($readRow.Count -ne 1 -or -not $readRow[0].isRead) {
    throw "FAIL: Notification should remain in history as read"
}
Write-Host "PASS: Mark-as-read keeps notification in history" -ForegroundColor Green

Write-Host ""
Write-Host "All notification isolation checks passed." -ForegroundColor Green
