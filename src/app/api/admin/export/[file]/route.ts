import { allOrders, listUsers } from '@/server/admin'
import { ApiError, csvResponse, route } from '@/server/http'

export const dynamic = 'force-dynamic'

/** GET /api/admin/export/orders.csv | users.csv */
export const GET = route<{ file: string }>((req, { file }) => {
  if (file === 'orders.csv') {
    return csvResponse('halhala-orders.csv',
      ['number', 'created_at', 'status', 'payment_method', 'payment_status', 'paid_at', 'subtotal_azn', 'delivery_azn', 'total_azn', 'name', 'phone', 'email', 'city', 'address', 'notes', 'items'],
      allOrders(req).map((o) => [o.number, o.createdAt, o.status, o.paymentMethod, o.paymentStatus, o.paidAt ?? '', o.subtotal, o.deliveryFee, o.total, o.name, o.phone, o.email, o.city, o.address, o.notes, o.items.map((i) => `${i.name} ${i.size} x${i.quantity}`).join('; ')]))
  }
  if (file === 'users.csv') {
    return csvResponse('halhala-users.csv', ['id', 'email', 'name', 'phone', 'city', 'address', 'role', 'created_at', 'orders', 'spent_azn'],
      listUsers(req).map((u) => [u.id, u.email, u.name, u.phone, u.city, u.address, u.role, u.createdAt, u.orders, u.spent]))
  }
  throw new ApiError(404, 'not_found')
})
