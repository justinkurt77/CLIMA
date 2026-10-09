Add-Type -AssemblyName System.Drawing

$inputPath = "C:\Users\User\.gemini\antigravity-ide\brain\e974a7a4-5b0f-4f7b-a638-17e1953f15a0\clima_modern_sun_1791528918861.jpg"
$outputPath = "c:\Users\User\EL NINO\palasumbong-app\public\logo.png"

$src = [System.Drawing.Bitmap]::FromFile($inputPath)
$width = $src.Width
$height = $src.Height

$dest = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$srcData = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$destData = $dest.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$bytes = $srcData.Stride * $height
$rgbValues = New-Object byte[] $bytes
[System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $rgbValues, 0, $bytes)

# Thresholds:
# Background has B > 220, G > 220, R > 220
# For anti-aliased edge blending:
$whiteThreshold = 225.0
$edgeStart = 175.0

for ($i = 0; $i -lt $bytes; $i += 4) {
    $b = [int]$rgbValues[$i]
    $g = [int]$rgbValues[$i + 1]
    $r = [int]$rgbValues[$i + 2]
    
    $minChannel = [Math]::Min($r, [Math]::Min($g, $b))
    
    if ($minChannel -ge $whiteThreshold) {
        # Pure or near-white background -> completely transparent
        $rgbValues[$i + 3] = 0
    } elseif ($minChannel -gt $edgeStart) {
        # Edge transition between edgeStart and whiteThreshold
        $alphaRatio = ($whiteThreshold - $minChannel) / ($whiteThreshold - $edgeStart)
        $a = [int](255 * $alphaRatio)
        
        # Color decontamination (unmultiply white background)
        if ($a -gt 0) {
            $unmixedR = [Math]::Max(0, [Math]::Min(255, [int](($r - 255 * (1.0 - $alphaRatio)) / $alphaRatio)))
            $unmixedG = [Math]::Max(0, [Math]::Min(255, [int](($g - 255 * (1.0 - $alphaRatio)) / $alphaRatio)))
            $unmixedB = [Math]::Max(0, [Math]::Min(255, [int](($b - 255 * (1.0 - $alphaRatio)) / $alphaRatio)))
            $rgbValues[$i] = [byte]$unmixedB
            $rgbValues[$i + 1] = [byte]$unmixedG
            $rgbValues[$i + 2] = [byte]$unmixedR
        }
        $rgbValues[$i + 3] = [byte]$a
    } else {
        # Solid foreground
        $rgbValues[$i + 3] = 255
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($rgbValues, 0, $destData.Scan0, $bytes)
$src.UnlockBits($srcData)
$dest.UnlockBits($destData)
$src.Dispose()

$dest.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Dispose()

Write-Output "Successfully processed transparent logo to $outputPath"
