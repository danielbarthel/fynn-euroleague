import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
root = sys.argv[1]
def ball(size, pad_ratio=0.12, bg=True, maskable=False):
    S = size*4
    im = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(im)
    if bg:
        if maskable: d.rectangle([0,0,S,S], fill="#0b0d12")
        else: d.rounded_rectangle([0,0,S-1,S-1], radius=int(S*0.22), fill="#0b0d12")
    pad = int(S*(0.22 if maskable else pad_ratio))
    box=[pad,pad,S-pad,S-pad]; r=(S-2*pad)/2; cx=cy=S/2
    d.ellipse(box, fill="#ff6a13")
    w=max(2,int(S*0.035)); c="#2a1205"
    d.ellipse(box, outline=c, width=w)
    d.line([pad,cy,S-pad,cy], fill=c, width=w); d.line([cx,pad,cx,S-pad], fill=c, width=w)
    rr=r*1.05; off=r*1.38
    d.arc([cx-off-rr, cy-rr, cx-off+rr, cy+rr], -43, 43, fill=c, width=w)
    d.arc([cx+off-rr, cy-rr, cx+off+rr, cy+rr], 137, 223, fill=c, width=w)
    return im.resize((size,size), Image.LANCZOS)
ball(32).save(f"{root}/icons/favicon-32.png")
ball(180, bg=True, maskable=True).save(f"{root}/icons/apple-touch-icon.png")
ball(192).save(f"{root}/icons/icon-192.png")
ball(512).save(f"{root}/icons/icon-512.png")
ball(512, maskable=True).save(f"{root}/icons/icon-maskable-512.png")

# OG image
W,H=1200,630
og=Image.new("RGB",(W,H),"#0b0d12")
glow=Image.new("RGB",(W,H),"#0b0d12"); g=ImageDraw.Draw(glow)
g.ellipse([600,-300,1500,450], fill="#5a2a0c"); g.ellipse([-300,350,500,900], fill="#2a2410")
glow=glow.filter(ImageFilter.GaussianBlur(140)); og.paste(glow)
d=ImageDraw.Draw(og)
for x in range(0,W,80): d.line([x,0,x,H], fill=(255,255,255,8) if False else "#11141b", width=1)
def font(paths,size):
    for p in paths:
        try: return ImageFont.truetype(p,size)
        except Exception: pass
    return ImageFont.load_default()
disp=font([f"{root}/fonts/bebas-neue-latin.woff2","/System/Library/Fonts/Supplemental/Impact.ttf"],190)
sans=font([f"{root}/fonts/inter-latin-var.woff2","/System/Library/Fonts/Supplemental/Arial Bold.ttf"],38)
small=font([f"{root}/fonts/inter-latin-var.woff2","/System/Library/Fonts/Supplemental/Arial.ttf"],28)
print("font:", getattr(disp,'path','default'))
d.text((70,80),"FÜR FYNN · EUROLEAGUE EDITION", font=small, fill="#9aa3b8")
# gradient title
txt="FYNNOMENAL"
mask=Image.new("L",(W,H),0); ImageDraw.Draw(mask).text((62,130),txt,font=disp,fill=255)
grad=Image.new("RGB",(W,H)); gd=ImageDraw.Draw(grad)
for y in range(H):
    t=min(1,max(0,(y-180)/180)); gd.line([0,y,W,y], fill=(255,int(255-(255-154)*t),int(255-(255-61)*t)))
og.paste(grad,(0,0),mask)
d.text((70,350),"Der letzte Wurf im Finale", font=sans, fill="#e8ebf3"); d.text((70,398),"gehört dir. Triffst du?", font=sans, fill="#e8ebf3")
d.rounded_rectangle([70,480,400,550], radius=16, fill="#ff6a13")
d.text((98,494),"JETZT SPIELEN", font=sans, fill="#111111")
b=ball(400, bg=False); og.paste(b,(800,180),b)
og.save(f"{root}/og.png", optimize=True)
