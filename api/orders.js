import { put, head } from '@vercel/blob';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const BLOB_PATH = 'orders.json';

    // 1. KHÁCH GỬI ĐƠN HÀNG MỚI (POST)
    if (req.method === 'POST') {
        try {
            const { name, phone, ageGroup, pkg, note } = req.body;
            if (!name || !phone) return res.status(400).json({ error: 'Thiếu thông tin' });

            const newOrder = {
                id: Date.now().toString(),
                name, phone, ageGroup, pkg, note,
                time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
            };

            // Lấy danh sách đơn hiện tại từ Blob
            let orders = [];
            try {
                const blobInfo = await head(BLOB_PATH);
                if (blobInfo && blobInfo.url) {
                    const response = await fetch(blobInfo.url);
                    orders = await response.json();
                }
            } catch (e) { orders = []; }

            orders.unshift(newOrder);

            // Ghi đè file JSON mới lên Vercel Blob Storage
            await put(BLOB_PATH, JSON.stringify(orders), {
                access: 'public',
                addRandomSuffix: false
            });

            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Lỗi máy chủ khi lưu đơn' });
        }
    }

    // 2. ADMIN TRUY XUẤT TẤT CẢ ĐƠN HÀNG (GET)
    if (req.method === 'GET') {
        try {
            const { phone, note, ageGroup } = req.query;

            if (phone === '0399641646' && note === 'teamnovas' && ageGroup && ageGroup.includes('16')) {
                let orders = [];
                try {
                    const blobInfo = await head(BLOB_PATH);
                    if (blobInfo && blobInfo.url) {
                        const response = await fetch(blobInfo.url);
                        orders = await response.json();
                    }
                } catch (e) { orders = []; }

                return res.status(200).json({ success: true, orders });
            } else {
                return res.status(403).json({ error: 'Từ chối truy cập' });
            }
        } catch (error) {
            return res.status(500).json({ error: 'Lỗi máy chủ khi tải đơn' });
        }
    }
}
