"""Generate path-node dots and typhoon center markers (true geometric center)."""
from PIL import Image, ImageDraw
import math

GRADES = {
    "TD": "#6BA3D4",
    "TS": "#E8C84A",
    "STS": "#E08A3C",
    "TY": "#D95B4F",
    "STY": "#8B6BB8",
    "SuperTY": "#E85A9B",
}


def hex_rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return int(a + (b - a) * t)


def mix(c1, c2, t):
    return tuple(lerp(a, b, t) for a, b in zip(c1, c2))


def make_dot(grade: str, color: str, size: int = 64):
    """Solid centered dot — no asymmetric glow so path passes through center."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = (size - 1) / 2
    cy = (size - 1) / 2
    rgb = hex_rgb(color)

    # Outer white ring then solid fill (symmetric)
    r_outer = size * 0.32
    r_inner = size * 0.24
    draw.ellipse(
        [cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer],
        fill=(255, 255, 255, 255),
    )
    draw.ellipse(
        [cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner],
        fill=(*rgb, 255),
    )
    # tiny center highlight (symmetric)
    cr = size * 0.07
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=(255, 255, 255, 220))

    img.save(f"src/static/dot-{grade}.png")
    print(f"  dot-{grade}.png  {size}x{size}  center=({cx:.1f},{cy:.1f})")


def spiral_points(cx, cy, turns=2.15, arms=2, scale=18, steps=180):
    pts = []
    for arm in range(arms):
        arm_pts = []
        phase = arm * math.pi
        for i in range(steps):
            t = i / (steps - 1)
            ang = t * turns * 2 * math.pi + phase
            rad = scale * (0.12 + 0.88 * t ** 0.85)
            x = cx + rad * math.cos(ang)
            y = cy + rad * math.sin(ang)
            arm_pts.append((x, y))
        pts.append(arm_pts)
    return pts


def make_marker(grade: str, color: str, size: int = 96):
    """Centered spiral marker; all layers share the same center."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = cy = (size - 1) / 2
    rgb = hex_rgb(color)
    light = mix(rgb, (255, 255, 255), 0.35)
    dark = mix(rgb, (0, 0, 0), 0.18)

    # soft outer halo (symmetric)
    for i in range(8, 0, -1):
        a = int(16 * (i / 8))
        rr = size * 0.40 * (i / 8)
        draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(*rgb, a))

    br = size * 0.32
    draw.ellipse([cx - br, cy - br, cx + br, cy + br], fill=(255, 255, 255, 250))
    ir = size * 0.26
    draw.ellipse([cx - ir, cy - ir, cx + ir, cy + ir], fill=(*rgb, 255))

    arms = spiral_points(cx, cy, turns=2.15, arms=2, scale=size * 0.24, steps=160)
    for arm in arms:
        n = len(arm)
        for i, (x, y) in enumerate(arm):
            t = i / max(n - 1, 1)
            w = 3.2 * (1 - 0.55 * t) + 1.0
            col = mix(light, (255, 255, 255), 0.25 + 0.4 * t)
            a = int(230 * (1 - 0.15 * t))
            draw.ellipse([x - w, y - w, x + w, y + w], fill=(*col, a))

    er = size * 0.065
    draw.ellipse([cx - er - 1, cy - er - 1, cx + er + 1, cy + er + 1], fill=(255, 255, 255, 255))
    draw.ellipse([cx - er, cy - er, cx + er, cy + er], fill=(*dark, 255))
    draw.ellipse(
        [cx - er * 0.35, cy - er * 0.35, cx + er * 0.35, cy + er * 0.35],
        fill=(255, 255, 255, 220),
    )

    img.save(f"src/static/typhoon-marker-{grade}.png")
    print(f"  typhoon-marker-{grade}.png  {size}x{size}")

    small = img.resize((40, 40), Image.Resampling.LANCZOS)
    small.save(f"src/static/typhoon-{grade}.png")
    print(f"  typhoon-{grade}.png  40x40")


def main():
    print("Generating dots...")
    for g, c in GRADES.items():
        make_dot(g, c)
    print("Generating markers...")
    for g, c in GRADES.items():
        make_marker(g, c)
    print("Done.")


if __name__ == "__main__":
    main()
