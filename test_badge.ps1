Add-Type -AssemblyName System.Drawing

$size = 64
$bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Clear with transparent
$g.Clear([System.Drawing.Color]::Transparent)

# Rounded rectangle badge
$rect = New-Object System.Drawing.Rectangle(2, 2, $size - 4, $size - 4)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 14
$d = $radius * 2

$path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
$path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
$path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
$path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
$path.CloseFigure()

# Background fill: #0B1120 (dark navy)
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 11, 17, 32))
$g.FillPath($bgBrush, $path)

# Subtle gradient border: cyan to purple
$c1 = [System.Drawing.Color]::FromArgb(200, 0, 229, 255) # #00E5FF
$c2 = [System.Drawing.Color]::FromArgb(200, 139, 92, 246) # #8B5CF6
$penBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45.0)
$pen = New-Object System.Drawing.Pen($penBrush, 2.0)
$g.DrawPath($pen, $path)

# "GS" text with vibrant gradient
$textRect = New-Object System.Drawing.RectangleF(0, 4, $size, $size - 4)
$t1 = [System.Drawing.Color]::FromArgb(255, 0, 229, 255)
$t2 = [System.Drawing.Color]::FromArgb(255, 139, 92, 246)
$textGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush($textRect, $t1, $t2, 45.0)

# Check font availability
$fontFamily = "Segoe UI"
$font = New-Object System.Drawing.Font($fontFamily, 26, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$g.DrawString("GS", $font, $textGrad, $textRect, $sf)

$g.Dispose()

$bmp.Save("test_badge.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "test_badge.png generated successfully!"
