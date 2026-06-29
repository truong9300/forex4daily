# Feature Specification: Realtime Forex Tracker

**Feature**: `001-realtime-forex-tracker`
**Date**: 2026-06-29
**Status**: Draft

---

## Overview

Tính năng theo dõi tỷ giá ngoại tệ realtime cho phép người dùng xem biểu đồ tỷ giá cập nhật liên tục, đặt cảnh báo khi giá đạt ngưỡng mong muốn, và tra cứu lịch sử giao dịch/biến động tỷ giá.

**Problem Statement**: Người dùng cần theo dõi tỷ giá ngoại tệ một cách liên tục nhưng không thể ngồi màn hình cả ngày. Họ thiếu công cụ tập trung để vừa xem xu hướng giá, vừa được thông báo kịp thời khi có cơ hội tốt.

**User Value**: Giúp người dùng nắm bắt cơ hội giao dịch ngoại tệ, tiết kiệm thời gian theo dõi thủ công, và đưa ra quyết định dựa trên dữ liệu lịch sử đáng tin cậy.

---

## User Stories

> Mỗi user story phải độc lập và có thể kiểm thử riêng biệt.

### P1 — Xem tỷ giá realtime

**As a** người dùng quan tâm đến ngoại tệ,
**I want to** xem tỷ giá của các cặp tiền tệ phổ biến cập nhật theo thời gian thực,
**So that** tôi biết chính xác giá thị trường hiện tại mà không cần tra cứu thủ công.

**Acceptance Criteria**:
- [ ] Hiển thị danh sách ít nhất 10 cặp tiền tệ phổ biến (USD/VND, EUR/USD, USD/JPY, GBP/USD, ...)
- [ ] Tỷ giá tự động cập nhật mà không cần tải lại trang, với độ trễ ≤ 30 giây
- [ ] Mỗi cặp tiền hiển thị: giá hiện tại, % thay đổi trong ngày, chiều tăng/giảm (màu xanh/đỏ)
- [ ] Người dùng có thể tìm kiếm/lọc cặp tiền theo tên

---

### P2 — Xem biểu đồ tỷ giá

**As a** người dùng muốn phân tích xu hướng,
**I want to** xem biểu đồ tỷ giá theo các khung thời gian khác nhau (1H, 1D, 1W, 1M),
**So that** tôi có thể nhận diện xu hướng và đưa ra quyết định giao dịch thông minh hơn.

**Acceptance Criteria**:
- [ ] Biểu đồ dạng đường (line chart) hoặc nến Nhật (candlestick) có thể chuyển đổi
- [ ] Hỗ trợ các khung thời gian: 1 giờ, 1 ngày, 1 tuần, 1 tháng, 3 tháng
- [ ] Người dùng có thể phóng to/thu nhỏ và kéo để xem dữ liệu lịch sử
- [ ] Hiển thị giá cao nhất, thấp nhất, mở cửa, đóng cửa khi hover vào điểm trên biểu đồ

---

### P3 — Đặt cảnh báo giá

**As a** người dùng muốn không bỏ lỡ cơ hội,
**I want to** đặt cảnh báo khi tỷ giá của một cặp tiền đạt đến mức giá tôi chỉ định,
**So that** tôi nhận được thông báo ngay lập tức mà không cần theo dõi liên tục.

**Acceptance Criteria**:
- [ ] Người dùng có thể đặt cảnh báo "giá cao hơn X" hoặc "giá thấp hơn Y" cho bất kỳ cặp tiền nào
- [ ] Cảnh báo hiển thị ngay trên giao diện (in-app notification) khi điều kiện được thỏa mãn
- [ ] Người dùng có thể xem, chỉnh sửa và xóa danh sách cảnh báo đã đặt
- [ ] Mỗi cảnh báo có thể đặt là một lần (tự xóa sau khi kích hoạt) hoặc lặp lại

---

### P4 — Xem lịch sử giao dịch/biến động

**As a** người dùng muốn tra cứu dữ liệu quá khứ,
**I want to** xem lịch sử biến động tỷ giá và các giao dịch tôi đã theo dõi,
**So that** tôi có thể học từ dữ liệu lịch sử và đánh giá lại các quyết định của mình.

**Acceptance Criteria**:
- [ ] Hiển thị bảng dữ liệu lịch sử tỷ giá theo ngày (có thể lọc theo cặp tiền và khoảng thời gian)
- [ ] Xuất dữ liệu lịch sử ra file CSV
- [ ] Hiển thị danh sách cảnh báo đã kích hoạt trong quá khứ với thời điểm kích hoạt

---

## Functional Requirements

> Tập trung vào WHAT và WHY. Không đề cập HOW (không nêu tech stack, API, code).

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Hiển thị tỷ giá realtime của ít nhất 10 cặp tiền tệ phổ biến | P1 | |
| FR-002 | Tỷ giá tự động cập nhật mà không cần reload trang | P1 | |
| FR-003 | Hiển thị % thay đổi và chiều biến động (tăng/giảm) cho mỗi cặp tiền | P1 | |
| FR-004 | Người dùng có thể tìm kiếm và lọc cặp tiền | P1 | |
| FR-005 | Biểu đồ tỷ giá với nhiều khung thời gian (1H, 1D, 1W, 1M, 3M) | P2 | |
| FR-006 | Biểu đồ hỗ trợ 2 loại: đường và nến Nhật | P2 | |
| FR-007 | Người dùng có thể zoom và pan trên biểu đồ | P2 | |
| FR-008 | Tooltip hiển thị OHLC (open, high, low, close) khi hover | P2 | |
| FR-009 | Đặt cảnh báo giá với điều kiện "cao hơn" hoặc "thấp hơn" | P3 | |
| FR-010 | Thông báo in-app khi cảnh báo được kích hoạt | P3 | [NEEDS CLARIFICATION: có cần push notification khi tab không active không?] |
| FR-011 | Quản lý danh sách cảnh báo (xem, sửa, xóa) | P3 | |
| FR-012 | Cảnh báo có thể là một lần hoặc lặp lại | P3 | |
| FR-013 | Bảng lịch sử tỷ giá với bộ lọc theo cặp tiền và thời gian | P4 | |
| FR-014 | Xuất lịch sử ra file CSV | P4 | |
| FR-015 | Danh sách lịch sử cảnh báo đã kích hoạt | P4 | |

---

## Non-Functional Requirements

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| NFR-001 | Performance | Tỷ giá cập nhật đủ nhanh để hữu ích | Độ trễ hiển thị ≤ 30 giây so với thị trường |
| NFR-002 | Performance | Biểu đồ phải mượt mà khi tương tác | Render < 200ms khi zoom/pan |
| NFR-003 | Availability | Ứng dụng vẫn dùng được khi nguồn dữ liệu tạm gián đoạn | Hiển thị thông báo lỗi rõ ràng, không crash |
| NFR-004 | Usability | Giao diện responsive | Hoạt động tốt trên mobile (≥ 375px) và desktop |
| NFR-005 | Data | Lịch sử tỷ giá có sẵn | Tối thiểu 3 tháng lịch sử |

---

## Success Criteria

| ID | Criterion | Measurement | Target |
|----|-----------|-------------|--------|
| SC-001 | Tỷ giá cập nhật tự động | Kiểm tra độ trễ cập nhật | ≤ 30 giây |
| SC-002 | Biểu đồ render nhanh | Đo thời gian render khi chuyển khung thời gian | < 500ms |
| SC-003 | Cảnh báo hoạt động chính xác | Kiểm tra kích hoạt cảnh báo khi giá vượt ngưỡng | 100% accuracy |
| SC-004 | Trải nghiệm mobile | Kiểm thử trên viewport 375px | Không có layout bị vỡ |
| SC-005 | Xuất CSV thành công | Kiểm tra file CSV được tạo ra | File đúng format, đủ dữ liệu |

---

## Edge Cases & Error Handling

- **Mất kết nối mạng**: Hiển thị badge "Offline" và thời điểm cập nhật cuối cùng; tiếp tục hiển thị dữ liệu cũ
- **Nguồn dữ liệu không phản hồi**: Hiển thị thông báo lỗi rõ ràng với nút thử lại
- **Cặp tiền không có dữ liệu lịch sử**: Hiển thị thông báo "Không có dữ liệu cho khoảng thời gian này"
- **Cảnh báo bị kích hoạt nhiều lần trong vài giây**: Chỉ thông báo một lần, tránh spam
- **Người dùng đặt cảnh báo trùng điều kiện**: Cảnh báo khi tạo cảnh báo trùng lặp
- **Xuất CSV với dữ liệu lớn (> 10,000 dòng)**: Hiển thị loading state, không đóng băng UI

---

## Entities & Data

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| CurrencyPair | Cặp tiền tệ được theo dõi | symbol (VD: USD/VND), baseCurrency, quoteCurrency, currentRate, changePercent, lastUpdated |
| RateHistory | Lịch sử tỷ giá theo thời gian | pairSymbol, timestamp, open, high, low, close, volume |
| PriceAlert | Cảnh báo giá do người dùng đặt | id, pairSymbol, condition (above/below), targetPrice, isRecurring, isActive, createdAt |
| AlertEvent | Sự kiện cảnh báo đã kích hoạt | alertId, pairSymbol, triggeredAt, priceAtTrigger |

---

## Assumptions & Dependencies

**Assumptions**:
- Có nguồn dữ liệu tỷ giá bên ngoài cung cấp giá realtime và lịch sử (API công khai hoặc có phí)
- Người dùng không cần đăng nhập để xem tỷ giá và biểu đồ (chức năng cơ bản là public)
- Cảnh báo giá chỉ hoạt động khi tab trình duyệt đang mở (không cần backend để push)

**Dependencies**:
- Nguồn dữ liệu tỷ giá realtime (API bên ngoài)
- Dữ liệu lịch sử tỷ giá (ít nhất 3 tháng)

**Out of Scope**:
- Thực hiện giao dịch mua/bán ngoại tệ thực tế
- Quản lý tài khoản người dùng / đăng nhập
- Push notification khi trình duyệt đóng (cần backend riêng)
- Phân tích kỹ thuật nâng cao (RSI, MACD, Bollinger Bands)

---

## Clarifications Needed

| # | Question | Impact if Unresolved |
|---|----------|---------------------|
| 1 | Nguồn dữ liệu tỷ giá: dùng API miễn phí (ExchangeRate-API, frankfurter.app) hay API trả phí (Alpha Vantage, Fixer.io)? | Ảnh hưởng đến tần suất cập nhật và số lượng cặp tiền hỗ trợ |
| 2 | Cảnh báo giá có cần hoạt động khi tab không active (browser push notification) không? | Nếu có → cần xin quyền Notification API và logic phức tạp hơn |
| 3 | Dữ liệu lịch sử có cần lưu local (offline) hay luôn fetch từ server? | Ảnh hưởng đến cấu trúc lưu trữ và trải nghiệm offline |

---

## Requirements Checklist

- [x] Không có implementation details (frameworks, APIs cụ thể) trong requirements
- [x] Các requirements có thể kiểm thử và rõ ràng
- [x] Success criteria có thể đo lường, không phụ thuộc công nghệ
- [x] Còn 3 câu hỏi cần làm rõ (đúng giới hạn tối đa)
- [x] Mỗi user story có thể kiểm thử độc lập
- [x] Edge cases đã được xác định
- [x] Non-functional requirements có chỉ số cụ thể
