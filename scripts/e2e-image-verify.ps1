$ErrorActionPreference = "Stop"
$base = "http://localhost:5073"
$web = "http://localhost:3000"
$ts = Get-Date -Format "yyyyMMddHHmmss"
$imagePath = "C:/Users/Eslam/Desktop/CairoBags-main/cairooo/CairoBags/cairo-bags-web/src/assets/hero/backpack.png"
$storageRoot = "C:/Users/Eslam/Desktop/CairoBags-main/cairooo/CairoBags/CairoBags/FileStorage"
$report = [ordered]@{}

function Set-Pass($key, $detail) { $script:report[$key] = @{ ok = $true; detail = $detail } }
function Set-Fail($key, $detail) { $script:report[$key] = @{ ok = $false; detail = $detail } }

function Post-Json($url, $obj) {
  $json = $obj | ConvertTo-Json -Depth 6 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  return Invoke-RestMethod -Uri $url -Method Post -Body $bytes -ContentType "application/json; charset=utf-8"
}

# 1-2 Create category + product
$category = Post-Json "$base/api/admin/categories" @{
  nameAr = "E2E Cat AR $ts"; nameEn = "E2E Category $ts"
  slugAr = "e2e-cat-$ts"; slugEn = "e2e-cat-$ts"; isActive = $true; sortOrder = 0
}
$product = Post-Json "$base/api/admin/products" @{
  categoryId = $category.id; status = 1; isFeatured = $true; isNewArrival = $false
  nameAr = "E2E Product AR $ts"; nameEn = "E2E Verify Product $ts"
  slugAr = "e2e-product-$ts"; slugEn = "e2e-product-$ts"
  variants = @(@{ colorNameAr = "Black AR"; colorNameEn = "Black"; sizeNameAr = ""; sizeNameEn = ""
    sku = "E2E-$ts"; price = 499; status = 1; isDefault = $true; quantity = 10; lowStockThreshold = 2 })
  images = @()
}
$productId = $product.id
$slug = $product.english.slug

# 3 Upload via product endpoint only
$beforeGeneric = @(Get-ChildItem $storageRoot -File -ErrorAction SilentlyContinue | % Name)
$uploadJson = curl.exe -s -X POST "$base/api/admin/products/$productId/images" -F "file=@$imagePath" -F "IsPrimary=true" -F "SortOrder=0"
$uploaded = $uploadJson | ConvertFrom-Json
$afterGeneric = @(Get-ChildItem $storageRoot -File -ErrorAction SilentlyContinue | % Name)
$newGeneric = Compare-Object $beforeGeneric $afterGeneric | ? SideIndicator -eq '=>'
if (-not $newGeneric -and $uploaded.imageUrl) {
  Set-Pass "Upload Endpoint" "POST /api/admin/products/$productId/images — not /api/File/Upload"
} else {
  Set-Fail "Upload Endpoint" "Generic files: $($newGeneric.InputObject -join ', ')"
}

# 4 Files
$dir = Join-Path $storageRoot "products/$productId"
$mainFile = Get-ChildItem $dir -Filter "main.*" | Select-Object -First 1
$ext = if ($mainFile) { $mainFile.Extension } else { ".jpg" }
$main = Join-Path $dir "main$ext"
$main600 = Join-Path $dir ("main_600" + $ext)
$main300 = Join-Path $dir ("main_300" + $ext)
if ((Test-Path $main) -and (Test-Path $main600) -and (Test-Path $main300)) {
  Set-Pass "Image Processing" "Normalize + derivatives OK ($ext)"
  Set-Pass "Files Written" "main$ext, main_600$ext, main_300$ext in products/$productId/"
} else {
  Set-Fail "Image Processing" "Missing derivatives"
  Set-Fail "Files Written" "main=$(Test-Path $main) 600=$(Test-Path $main600) 300=$(Test-Path $main300)"
}

# 5 Database
$dbRaw = sqlcmd -S "(localdb)\MSSQLLocalDB" -d CairoBagsDb -W -h -1 -Q "SET NOCOUNT ON; SELECT ImageUrl, ThumbnailUrl, CAST(IsPrimary AS int) FROM ProductImages WHERE ProductId=$productId"
$dbLine = ($dbRaw | Where-Object { $_ -and $_ -notmatch 'rows affected' -and $_ -notmatch '^-+' } | Select-Object -First 1)
if ($dbLine) {
  $p = $dbLine.Trim() -split '\|'
  $iu = $p[0].Trim(); $tu = $p[1].Trim(); $ip = $p[2].Trim()
  if ($iu -like "*/products/$productId/main.*" -and $tu -like "*/products/$productId/main_600.*" -and $ip -eq '1') {
    Set-Pass "Database" "ImageUrl=$iu; ThumbnailUrl=$tu; IsPrimary=1"
  } else { Set-Fail "Database" $dbLine }
} else { Set-Fail "Database" "No row" }

# 6 API JSON
$api = Invoke-RestMethod "$base/api/products/$productId"
if ($api.primaryImageUrl -like "*/products/$productId/main_600.*" -and $api.images[0].imageUrl -like "*/products/$productId/main.*") {
  Set-Pass "API JSON" "primaryImageUrl=$($api.primaryImageUrl)"
} else {
  Set-Fail "API JSON" "primary=$($api.primaryImageUrl) image=$($api.images[0].imageUrl)"
}

# Add to cart
$variantId = $api.variants[0].id
Post-Json "$base/api/cart/items" @{ productVariantId = $variantId; quantity = 1 } | Out-Null

# Network HEAD checks
$paths = @($api.primaryImageUrl, $api.images[0].imageUrl, $api.images[0].thumbnailUrl, ($api.images[0].imageUrl -replace 'main(\.[^.]+)$','main_300$1'))
$bad = @()
foreach ($path in $paths) {
  try {
    $code = (Invoke-WebRequest "$base$path" -UseBasicParsing -Method Head).StatusCode
    if ($code -ne 200) { $bad += "$code $path" }
  } catch { $bad += "$($_.Exception.Response.StatusCode.value__) $path" }
}
if ($bad.Count -eq 0) {
  Set-Pass "Browser Network" "All image URLs HTTP 200"
  Set-Pass "No 404" "Zero failed image requests"
} else {
  Set-Fail "Browser Network" ($bad -join '; ')
  Set-Fail "No 404" ($bad -join '; ')
}

@{
  productId = $productId; slug = $slug; base = $base; web = $web; variantId = $variantId
  primaryImageUrl = $api.primaryImageUrl; imageUrl = $api.images[0].imageUrl
  thumbnailUrl = $api.images[0].thumbnailUrl
  main300 = ($api.images[0].imageUrl -replace 'main(\.[^.]+)$','main_300$1')
} | ConvertTo-Json | Set-Content "C:/Users/Eslam/Desktop/CairoBags-main/cairooo/CairoBags/scripts/e2e-context.json"

$report | ConvertTo-Json -Depth 4 | Set-Content "C:/Users/Eslam/Desktop/CairoBags-main/cairooo/CairoBags/scripts/e2e-api-report.json"
Write-Output "PRODUCT_ID=$productId"
Write-Output "SLUG=$slug"
$report.GetEnumerator() | % { Write-Output "$($_.Key): $(if($_.Value.ok){'PASS'}else{'FAIL'}) — $($_.Value.detail)" }
