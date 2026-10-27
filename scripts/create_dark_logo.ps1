Add-Type -AssemblyName System.Drawing

$inputPath = "c:\Users\User\EL NINO\palasumbong-app\public\logo.png"
$outputPath = "c:\Users\User\EL NINO\palasumbong-app\public\logo-dark.png"

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

# For dark mode, turn the dark text ("CLIMA" at the bottom) into white while keeping the orange sun untouched.
# The sun is in the upper ~70% of the image (y < 720). The text "CLIMA" is at y > 720.
$stride = $srcData.Stride

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $i = ($y * $stride) + ($x * 4)
        $a = [int]$rgbValues[$i + 3]
        if ($a -eq 0) { continue }
        
        $b = [int]$rgbValues[$i]
        $g = [int]$rgbValues[$i + 1]
        $r = [int]$rgbValues[$i + 2]
        
        # If in the lower portion (text region) and the pixel is dark/neutral (text)
        if ($y -gt 700 -and $r -lt 120 -and $g -lt 120 -and $b -lt 120) {
            # Invert brightness to pure white while preserving alpha anti-aliasing
            $rgbValues[$i] = 255     # B
            $rgbValues[$i + 1] = 255 # G
            $rgbValues[$i + 2] = 255 # R
        }
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($rgbValues, 0, $destData.Scan0, $bytes)
$src.UnlockBits($srcData)
$dest.UnlockBits($destData)
$src.Dispose()

$dest.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Dispose()

Write-Output "Successfully saved dark mode logo to $outputPath"
