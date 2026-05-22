'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { supplierOrdersApi, type SupplierNotificationItem } from '@/store/api/supplierOrdersApi'

interface Options {
  accessToken: string | undefined | null
  supplierId: number | undefined | null
  onNotification?: () => void
  onRealtimeNotification?: (item: SupplierNotificationItem) => void
}

export function useSupplierRealtimeOrders({ accessToken, supplierId, onNotification, onRealtimeNotification }: Options) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Reuse the Pusher constructor already set globally by useEchoSetup (Providers.tsx)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PusherClass = (window as any).Pusher
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    const apiBaseUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '')

    if (!PusherClass || !pusherKey || !pusherCluster || !apiBaseUrl || !accessToken || !supplierId) return

    const channelName = `private-supplier-${supplierId}`

    const pusher = new PusherClass(pusherKey, {
      cluster: pusherCluster,
      channelAuthorization: {
        endpoint: `${apiBaseUrl}/api/supplier/realtime/pusher/auth`,
        transport: 'ajax',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      },
    })

    const channel = pusher.subscribe(channelName)

    const onOrderCreated = () => {
      dispatch(supplierOrdersApi.util.invalidateTags(['Orders', 'SupplierNotifications']))
    }

    const onNotificationCreated = (event: {
      order_id?: number
      checkout_id?: string
      type?: string
      title?: string
      description?: string
      href?: string
      created_at?: string
    }) => {
      const newItem: SupplierNotificationItem = {
        id: String(event.order_id ?? Date.now()),
        title: event.title ?? 'New ZQ Order',
        description: event.description ?? '',
        count: 1,
        href: event.href ?? '/supplier/orders',
        updated_at: event.created_at ?? new Date().toISOString(),
      }

      // Optimistically push the notification into the RTK Query cache immediately
      dispatch(
        supplierOrdersApi.util.updateQueryData('getSupplierOrderNotifications', undefined, (draft) => {
          const existingIndex = draft.items.findIndex((item) => item.id === newItem.id)
          if (existingIndex >= 0) draft.items.splice(existingIndex, 1)
          draft.items.unshift(newItem)
          draft.unread_count = Number(draft.unread_count ?? 0) + 1
        }),
      )

      onRealtimeNotification?.(newItem)
      onNotification?.()
    }

    channel.bind('order.created', onOrderCreated)
    channel.bind('notification.created', onNotificationCreated)

    return () => {
      channel.unbind('order.created', onOrderCreated)
      channel.unbind('notification.created', onNotificationCreated)
      pusher.unsubscribe(channelName)
      pusher.disconnect()
    }
  }, [accessToken, supplierId, dispatch, onNotification, onRealtimeNotification])
}
