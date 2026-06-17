# Requirements Analysis & System Assessment

## 1. System Assessment

### 1.1 Security Implementation
- **Admin Session Management**: The system uses a secure HMAC-based token stored in HTTP-only cookies (`admin_upload_session`). Server-side validation is implemented via `verifyAdminSession`, which prevents unauthorized access to sensitive API routes like `/api/admin/orders`.
- **Image Protection**: The `ProtectedImage` component successfully prevents basic image theft by disabling the context menu (`onContextMenu`) and dragging (`draggable={false}`).
- **Data Integrity**: Manual payment flows are handled through a two-stage process (persistence -> approval), ensuring that orders are only marked as "paid" after admin verification of the uploaded receipt.

### 1.2 Manual Payment Flow
- **Workflow**: The `/api/checkout/manual-route` handles the upload of transfer receipts to Supabase Storage (`transfer_receipts` bucket). Orders are created with a state of `unpaid_verify_transfer`.
- **Admin Verification**: Admins can approve these orders via `/api/admin/orders/approve-manual`, which triggers the generation of a PDF receipt and a confirmation email.
- **Reliability**: The system uses a service-role client for storage operations to ensure consistent behavior regardless of client-side authentication.

### 1.3 Design System Audit
- **Monochrome Compliance**: The `scripts/design-audit.mjs` enforces the strict black, white, and gray palette. All current components (`ProtectedImage`, `MasonryArchive`) adhere to this rule.
- **Typography**: The mix of monospace and sans-serif fonts provides a clean, technical aesthetic consistent with the brand.

---

## 2. Pinterest-Style Archive Requirements

### 2.1 Technical Gap Analysis
Current Implementation (`components/MasonryArchive.tsx`):
- Uses CSS `columns`.
- **Limitation**: CSS columns stack items vertically within each column first. This means the visual "top-to-bottom" order is broken (e.g., item 2 is below item 1 in column 1, rather than being to the right of item 1 in column 2).
- **Limitation**: No infinite scroll; all images are loaded at once.

### 2.2 Functional Requirements (Pinterest-Style)
1. **True Masonry Layout**:
   - Use a JavaScript-based calculation (e.g., `react-masonry-css` or a custom hook) to position items horizontally-first while filling gaps.
   - Maintain the strict monochrome grid.
2. **Infinite Scroll**:
   - Implement a "Load More" trigger or Intersection Observer at the bottom of the grid.
   - Integrate with the `getPhotographs` API using `limit` and `offset`.
3. **Enhanced Interactivity**:
   - **Hover States**: Reveal metadata (Title, Location) and action buttons (Save, Order) on hover.
   - **Monochrome Animations**: Use subtle fade-ins and transitions that don't involve color.
   - **Saving/Pinning**: Persistence of "Saved" state in local storage (already partially implemented in `ProtectedImage`).
4. **Loading States**:
   - Implementation of monochrome skeletons or low-contrast loading placeholders.

---

## 3. Implementation Proposal

### 3.1 Masonry & Layout
- **Tool**: `react-masonry-css` is recommended for its simplicity and Next.js compatibility.
- **Styling**: Ensure the gap between items remains consistent (e.g., `gap-3` to `gap-4`).

### 3.2 Data Fetching
- Update `app/archive/page.tsx` to be a Client Component or use a Client Wrapper to handle the infinite scroll state.
- Create a new API endpoint `/api/photographs` to serve paginated data to the client.

### 3.3 Interactive Overlay
- Redesign the `ProtectedImage` overlay to use a semi-transparent black background with white monospace text.
- Ensure the "Order Print" button remains accessible and clearly visible on hover.

---

**Status**: Ready for implementation of Phase: Pinterest Archive.
