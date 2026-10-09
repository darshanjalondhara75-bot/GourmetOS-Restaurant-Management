# Table Booking + QR + Live Occupancy Update

Implemented in the existing GourmetOS project.

## Customer flow
1. User enters a customer name.
2. User books an `Available` table.
3. The table becomes `Reserved` and the customer name is attached to the table.
4. User Panel shows a live reservation card with **View QR Code** and **Enter Customer Menu**.
5. **Enter Customer Menu** starts a secure server-side dining session and adds a one-time token to the menu URL.
6. The customer can place only one order with that session token; the backend consumes the token atomically.
7. The order goes to Chef Panel and the existing order status flow drives User Panel tracking.
8. Cashier payment marks the order paid, closes the dining session/booking, and releases the table back to `Available`.

## Live table and order synchronization
- The backend streams successful API changes over an authenticated Server-Sent Events connection.
- Customer, cashier, chef, and admin views subscribe to the data categories they display and update without a page reload.
- The frontend retries a dropped live connection, refreshes data when a tab becomes visible, and uses a 30-second refresh as a fallback.
- The event broker is in-process; run one backend worker for updates to be shared with all connected clients.

## QR deployment
Set `PUBLIC_APP_URL` in `backend/.env` to the public frontend URL when deployed. The QR mapping endpoint uses this value to avoid generating a QR that points to localhost.
