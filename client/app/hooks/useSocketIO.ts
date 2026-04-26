"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketIOOptions {
    token: string | null;
    onNotification?: (data: NotificationPayload) => void;
    onApprovalUpdated?: (data: unknown) => void;
    onPoStatusChanged?: (data: unknown) => void;
    onGrnUpdated?: (data: unknown) => void;
    onInvoiceStatusChanged?: (data: unknown) => void;
    onBudgetAlert?: (data: unknown) => void;
}

export interface NotificationPayload {
    id: string;
    eventType: string;
    subject?: string;
    body?: string;
    referenceType?: string | null;
    referenceId?: string | null;
    status: string;
    createdAt: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

export function useSocketIO({
    token,
    onNotification,
    onApprovalUpdated,
    onPoStatusChanged,
    onGrnUpdated,
    onInvoiceStatusChanged,
    onBudgetAlert,
}: UseSocketIOOptions) {
    const socketRef = useRef<Socket | null>(null);

    // Keep callback refs stable
    const onNotificationRef      = useRef(onNotification);
    const onApprovalUpdatedRef   = useRef(onApprovalUpdated);
    const onPoStatusChangedRef   = useRef(onPoStatusChanged);
    const onGrnUpdatedRef        = useRef(onGrnUpdated);
    const onInvoiceStatusRef     = useRef(onInvoiceStatusChanged);
    const onBudgetAlertRef       = useRef(onBudgetAlert);
    // eslint-disable-next-line react-hooks/refs
    onNotificationRef.current      = onNotification;
    // eslint-disable-next-line react-hooks/refs
    onApprovalUpdatedRef.current   = onApprovalUpdated;
    // eslint-disable-next-line react-hooks/refs
    onPoStatusChangedRef.current   = onPoStatusChanged;
    // eslint-disable-next-line react-hooks/refs
    onGrnUpdatedRef.current        = onGrnUpdated;
    // eslint-disable-next-line react-hooks/refs
    onInvoiceStatusRef.current     = onInvoiceStatusChanged;
    // eslint-disable-next-line react-hooks/refs
    onBudgetAlertRef.current       = onBudgetAlert;

    useEffect(() => {
        if (!token) return;

        const socket = io(`${SOCKET_URL}/events`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionAttempts: 10,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('ping');
        });

        socket.on('notification:new', (data: NotificationPayload) => {
            onNotificationRef.current?.(data);
        });

        socket.on('approval:updated', (data: unknown) => {
            onApprovalUpdatedRef.current?.(data);
        });

        socket.on('po:status_changed', (data: unknown) => {
            onPoStatusChangedRef.current?.(data);
        });

        socket.on('grn:updated', (data: unknown) => {
            onGrnUpdatedRef.current?.(data);
        });

        socket.on('invoice:status_changed', (data: unknown) => {
            onInvoiceStatusRef.current?.(data);
        });

        socket.on('budget:alert', (data: unknown) => {
            onBudgetAlertRef.current?.(data);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]); // reconnect only if token changes

    const emit = useCallback((event: string, data?: unknown) => {
        socketRef.current?.emit(event, data);
    }, []);

    return { emit };
}
