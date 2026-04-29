'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';

type TokenUser = { accessToken?: string; id?: string };

export function useAccountDeletedListener() {
    const { data: session, status } = useSession();
    const user = session?.user as TokenUser | undefined;
    const accessToken = user?.accessToken;
    const userId = user?.id;

    useEffect(() => {
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
        const apiBaseUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? '').replace(/\/+$/, '');

        if (status !== 'authenticated' || !accessToken || !userId || !pusherKey || !pusherCluster) {
            return;
        }

        const pusher = new Pusher(pusherKey, {
            cluster: pusherCluster,
            channelAuthorization: {
                endpoint: `${apiBaseUrl}/api/customer/pusher/auth`,
                transport: 'ajax',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json',
                },
            },
        });

        const channel = pusher.subscribe(`private-customer.${userId}`);

        const onDeleted = () => {
            window.dispatchEvent(new CustomEvent('afhome:customer-deleted'));
        };

        channel.bind('account.deleted', onDeleted);

        return () => {
            channel.unbind('account.deleted', onDeleted);
            pusher.unsubscribe(`private-customer.${userId}`);
            pusher.disconnect();
        };
    }, [accessToken, userId, status]);
}
