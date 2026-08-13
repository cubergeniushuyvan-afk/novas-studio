# Novas Studio — Vercel Secure Admin

## Chạy local
Mở `index.html` để xem giao diện. **Đăng nhập admin cần Vercel Functions**, nên để kiểm tra đăng nhập đầy đủ hãy deploy lên Vercel.

## Đăng nhập quản trị
Mật khẩu KHÔNG còn nằm trong HTML/JavaScript. Hãy tạo Environment Variable trên Vercel:

- Name: `ADMIN_PASSWORD`
- Value: **mật khẩu mới của bạn** (không dùng mật khẩu cũ nếu đã từng công khai)
- Environment: Production (và Preview nếu muốn)

Sau khi thêm biến môi trường, hãy **Redeploy** project.

Website gửi mật khẩu tới `/api/login`; server kiểm tra và trả về cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Người xem source/DevTools sẽ không thấy mật khẩu.

## Lưu ý quan trọng
Bản này bảo vệ **mật khẩu đăng nhập**. Dữ liệu sản phẩm của giao diện hiện tại vẫn được lưu bằng `localStorage`, tức là sản phẩm/ảnh chỉnh trên một trình duyệt chưa tự đồng bộ sang thiết bị khác.

Muốn website có **admin thật + dữ liệu sản phẩm/ảnh dùng chung cho mọi khách**, cần thêm database + storage (ví dụ Vercel Blob/Postgres) và API CRUD. Không nên coi localStorage là cơ sở dữ liệu.

## API
- `POST /api/login` — kiểm tra mật khẩu và tạo session cookie.
- `GET /api/session` — kiểm tra session.
- `POST /api/logout` — đăng xuất.



## Bảo mật Vercel
Mật khẩu quản trị KHÔNG nằm trong source. `api/login.js` đọc `process.env.ADMIN_PASSWORD`. Hãy đặt biến `ADMIN_PASSWORD` trong Vercel và redeploy. Không đưa mật khẩu thật vào Git/ZIP.


## Đồng bộ dữ liệu Novas qua Vercel Blob

Bản này đã chuyển dữ liệu sản phẩm từ `localStorage` sang Vercel Blob:
- `/api/products` lưu danh sách sản phẩm + settings.
- `/api/upload-image` lưu ảnh sản phẩm.
- Admin vẫn được bảo vệ bằng `ADMIN_PASSWORD`.
- `localStorage` chỉ còn làm bộ nhớ dự phòng/cục bộ.

### Biến môi trường cần có trên Vercel

- `ADMIN_PASSWORD`
- `BLOB_READ_WRITE_TOKEN`

Khi kết nối Blob Store với project trên Vercel, hãy bật **Add a read-write token env var** để tạo token. Nếu đã kết nối trước đó mà chưa bật, vào Storage → `novas-storage` → Connect to Project và kết nối lại với tùy chọn này.

Sau khi deploy, đăng nhập Admin và lưu một mẫu. Website sẽ lưu ảnh + dữ liệu lên Blob; thiết bị khác mở website sẽ đọc cùng dữ liệu server.
