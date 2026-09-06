Add-Type -AssemblyName System.Drawing

$size = 32
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Background
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 11, 17, 32)) # #0B1120
$g.FillRectangle($bgBrush, 0, 0, $size, $size)

# Gradient text GS
$rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
$c1 = [System.Drawing.Color]::FromArgb(255, 0, 229, 255) # #00E5FF (cyan)
$c2 = [System.Drawing.Color]::FromArgb(255, 139, 92, 246) # #8B5CF6 (purple)
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)

$font = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Bold)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$g.DrawString("GS", $font, $gradBrush, $rect, $sf)

$g.Dispose()

# Save ICO
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = [System.IO.File]::Create("test_favicon.ico")
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
$bmp.Dispose()

Write-Host "ICO successfully generated!"
