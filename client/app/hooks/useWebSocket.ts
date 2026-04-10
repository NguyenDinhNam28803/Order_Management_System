"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
    type: string;
    data: unknown;
    timestamp: string;
}

type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseWebSocketOptions {
    url: string;
    onMessage?: (message: WebSocketMessage) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    autoConnect?: boolean;
}

export function useWebSocket({
    url,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    autoConnect = true
}: UseWebSocketOptions) {
    const [status, setStatus] = useState<WebSocketStatus>("disconnected");
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isManualClose = useRef(false);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        setStatus("connecting");
        isManualClose.current = false;

        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                setStatus("connected");
                reconnectAttemptsRef.current = 0;
                onConnect?.();
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    setLastMessage(message);
                    onMessage?.(message);
                } catch (err) {
                    console.error("WebSocket message parse error:", err);
                }
            };

            ws.onclose = () => {
                setStatus("disconnected");
                onDisconnect?.();

                if (!isManualClose.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++;
                    reconnectTimerRef.current = setTimeout(() => {
                        connect();
                    }, reconnectInterval);
                }
            };

            ws.onerror = (error) => {
                setStatus("error");
                onError?.(error);
            };
        } catch (err) {
            setStatus("error");
            console.error("WebSocket connection error:", err);
        }
    }, [url, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts]);

    const disconnect = useCallback(() => {
        isManualClose.current = true;
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        wsRef.current?.close();
        wsRef.current = null;
        setStatus("disconnected");
    }, []);

    const sendMessage = useCallback((type: string, data: unknown) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type,
                data,
                timestamp: new Date().toISOString()
            }));
            return true;
        }
        return false;
    }, []);

    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, connect, disconnect]);

    return {
        status,
        lastMessage,
        connect,
        disconnect,
        sendMessage,
        isConnected: status === "connected"
    };
}

// Specialized hook for contract notifications
export function useContractNotifications(supplierId: string, onNotification?: (data: unknown) => void) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    
    const handleMessage = useCallback((message: WebSocketMessage) => {
        if (message.type === "CONTRACT_NOTIFICATION" || message.type === "CONTRACT_UPDATE") {
            onNotification?.(message.data);
        }
    }, [onNotification]);

    const { status, sendMessage, isConnected } = useWebSocket({
        url: `${wsUrl}/contracts?supplierId=${supplierId}`,
        onMessage: handleMessage,
        autoConnect: !!supplierId
    });

    const acknowledgeContract = useCallback((contractId: string) => {
        sendMessage("ACKNOWLEDGE_CONTRACT", { contractId });
    }, [sendMessage]);

    const requestSignature = useCallback((contractId: string) => {
        sendMessage("REQUEST_SIGNATURE", { contractId });
    }, [sendMessage]);

    return {
        status,
        isConnected,
        acknowledgeContract,
        requestSignature
    };
}
