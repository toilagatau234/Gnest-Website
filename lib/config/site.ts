export const siteConfig = {
  name: 'Đại Tài Lợi',
  description:
    'Công Ty TNHH MTV Đại Tài Lợi – Chuyên cung cấp chai lọ thủy tinh, hộp nhựa, bao bì ngành yến, in ấn phẩm và gia công CNC. Hotline: 0939.991.551',
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://dytailoi.com'),
};
