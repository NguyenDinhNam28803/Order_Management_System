"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useProcurement, Notification } from "../context/ProcurementContext";

/**
 * ToastItem - Individual toast notification with progress bar and hover pause
 */
const ToastItem = ({ notification }: { notification: Notification }) => {
    const { removeNotification } = useProcurement();
    const [isPaused, setIsPaused] = useState(false);
    const duration = 5000;
    const startTimeRef = useRef<number>(Date.now());
    const remainingTimeRef = useRef<number>(duration);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const remove = useCallback(() => {
        removeNotification(notification.id);
    }, [notification.id, removeNotification]);

    const startTimer = useCallback((time: number) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(remove, time);
        startTimeRef.current = Date.now();
    }, [remove]);

    useEffect(() => {
        startTimer(duration);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [startTimer]);

    const handleMouseEnter = () => {
        setIsPaused(true);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            remainingTimeRef.current -= Date.now() - startTimeRef.current;
        }
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
        startTimer(remainingTimeRef.current);
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'success': return <CheckCircle2 className="w-5 h-5" />;
            case 'error': return <XCircle className="w-5 h-5" />;
            case 'warning': return <AlertTriangle className="w-5 h-5" />;
            case 'info': return <Info className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    return (
        <div 
            className={`toast-item ${notification.type} ${isPaused ? 'paused' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                '--toast-duration': `${duration}ms`
            } as React.CSSProperties}
        >
            <div className="toast-icon">
                {getIcon()}
            </div>
            
            <div className="toast-content">
                <p className="toast-message">{notification.message}</p>
            </div>

            <button className="toast-close" onClick={remove}>
                <X size={14} />
            </button>

            <div className="toast-progress-bar">
                <div 
                    className="progress-fill" 
                    style={{ 
                        animationDuration: `${duration}ms`,
                        animationPlayState: isPaused ? 'paused' : 'running'
                    }}
                ></div>
            </div>
        </div>
    );
};

/**
 * ToastContainer - Global container for all notifications
 */
export default function ToastContainer() {
    const { notifications, currentUser } = useProcurement();

    if (!notifications || notifications.length === 0) return null;

    // Filter notifications based on role parity with existing logic in AppContent
    const filteredNotifications = notifications.filter((n: Notification) => 
        !n.role || n.role === currentUser?.role
    );

    if (filteredNotifications.length === 0) return null;

    return (
        <div className="toast-container-global">
            {filteredNotifications.map((t) => (
                <ToastItem key={t.id} notification={t} />
            ))}
            <style jsx global>{`
                .toast-container-global {
                    position: fixed;
                    top: 24px;
                    right: 24px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-width: 400px;
                    width: calc(100% - 48px);
                    pointer-events: none;
                }

                .toast-item {
                    position: relative;
                    display: flex;
                    align-items: center;
                    padding: 18px 24px;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 20px;
                    box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.1), 0 5px 15px -5px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    pointer-events: auto;
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
                    animation: toast-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                @keyframes toast-in {
                    from { transform: translateX(50px) scale(0.9); opacity: 0; }
                    to { transform: translateX(0) scale(1); opacity: 1; }
                }

                .toast-item.success { border-left: 6px solid #10b981; }
                .toast-item.error { border-left: 6px solid #ef4444; }
                .toast-item.warning { border-left: 6px solid #f59e0b; }
                .toast-item.info { border-left: 6px solid #3b82f6; }

                .toast-icon {
                    margin-right: 16px;
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                }

                .success .toast-icon { color: #10b981; }
                .error .toast-icon { color: #ef4444; }
                .warning .toast-icon { color: #f59e0b; }
                .info .toast-icon { color: #3b82f6; }

                .toast-content {
                    flex: 1;
                    padding-right: 8px;
                }

                .toast-message {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                    line-height: 1.5;
                    font-family: 'Outfit', sans-serif;
                }

                .toast-close {
                    background: #f1f5f9;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    width: 24px;
                    height: 24px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .toast-close:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                    transform: rotate(90deg);
                }

                /* Progress Bar */
                .toast-progress-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: rgba(0, 0, 0, 0.03);
                }

                .progress-fill {
                    height: 100%;
                    width: 100%;
                    transform-origin: left;
                    animation: progress-shrink linear forwards;
                }

                .success .progress-fill { background: #10b981; }
                .error .progress-fill { background: #ef4444; }
                .warning .progress-fill { background: #f59e0b; }
                .info .progress-fill { background: #3b82f6; }

                @keyframes progress-shrink {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }

                /* Interaction Effects */
                .toast-item.success:hover {
                    box-shadow: 0 10px 40px rgba(16, 185, 129, 0.15);
                    transform: translateY(-2px);
                }

                .toast-item.error:hover {
                    box-shadow: 0 10px 40px rgba(239, 68, 68, 0.15);
                    transform: translateY(-2px);
                }

                /* Animation Keyframes */
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-4px); }
                    40% { transform: translateX(4px); }
                    60% { transform: translateX(-4px); }
                    80% { transform: translateX(4px); }
                }

                .toast-item.error {
                    animation: toast-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), shake 0.5s ease-in-out 0.5s;
                }

                @keyframes glow {
                    0% { box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1); }
                    50% { box-shadow: 0 10px 40px rgba(16, 185, 129, 0.3); }
                    100% { box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1); }
                }

                .toast-item.success {
                    animation: toast-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), glow 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
