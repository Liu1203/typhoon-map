from PIL import Image, ImageDraw

GRADES = {
    "TD": "#5DADE2", "TS": "#F4D03F", "STS": "#E67E22",
    "TY": "#E74C3C", "STY": "#8E44AD", "SuperTY": "#FF1493",
}

SIZE = 48        # match original canvas
CX = SIZE / 2    # 24.0
R = 15           # circle radius (= 30px diameter, slightly smaller than original 32)
STROKE = 2       # white border

for grade, hex_color in GRADES.items():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # filled circle
    draw.ellipse([CX - R, CX - R, CX + R, CX + R], fill=hex_color)
    # white stroke
    draw.ellipse([CX - R, CX - R, CX + R, CX + R],
                 fill=None, outline="white", width=STROKE)

    img.save(f"src/static/dot-{grade}.png")
    print(f"  dot-{grade}.png  {SIZE}x{SIZE}  r={R}  center=({CX:.1f},{CX:.1f})")

print("Done.")
