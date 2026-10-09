# Extension-Fuoverflow-test-checklist

Extension trình duyệt (Manifest V3) thêm ô checkbox vào từng thread trong danh sách
diễn đàn [FuOverflow](https://fuoverflow.com), để bạn đánh dấu những đề thi đã ôn xong.

## Tính năng

- Có checkbox đứng trước tiêu đề mỗi thread trong danh sách.
- Thread đã tick sẽ bị gạch ngang và tô nền xanh nhạt.
- Trạng thái lưu trong `localStorage` (key `fuo-test-checklist`), theo ID thread, nên vẫn
  giữ nguyên khi phân trang, đổi thứ tự hoặc tải lại trang.
- Thanh tiến độ hiển thị tổng số đề đã tick và số đề đã tick trên trang hiện tại.

## Cài đặt (Brave / Chrome)

1. Mở `brave://extensions` (hoặc `chrome://extensions`).
2. Bật **Developer mode**.
3. Bấm **Load unpacked** và chọn thư mục này.
4. Mở một trang diễn đàn, ví dụ https://fuoverflow.com/forums/MLN111/.

## Lưu ý

- Dữ liệu lưu riêng theo từng trình duyệt; tick ở Brave sẽ không hiện ở Chrome.
- Tổng số đề đã tick tính trên toàn bộ fuoverflow.com, không riêng một môn.
