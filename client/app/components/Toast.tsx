"use client";

import React, { useEffect, useState, useCallback, useRef, createContext, useContext } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useProcurement, Notification } from "../context/ProcurementContext";

// Local context for standalone use
interface ToastContextType {
    notifications: Notification[];
    notify: (message: string, type?: Notification['type']) => void;
    removeNotification: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notify = useCallback((message: string, type: Notification['type'] = 'info') => {
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev, { id, message, type }]);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ notifications, notify, removeNotification }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const local = useContext(ToastContext);
    if (local) return local;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const proc = useProcurement();
    return {
        notifications: proc.notifications,
        notify: proc.notify,
        removeNotification: proc.removeNotification
    };
};

const ToastItem = ({ notification, onRemove }: { notification: Notification; onRemove: (id: number) => void }) => {
    const [isPaused, setIsPaused] = useState(false);
    const duration = 5000;
    const startTimeRef = useRef<number>(0);
    const remainingTimeRef = useRef<number>(duration);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const remove = useCallback(() => {
        onRemove(notification.id);
    }, [notification.id, onRemove]);

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
            case 'success': return <CheckCircle2 className="w-[18px] h-[18px]" />;
            case 'error':   return <XCircle      className="w-[18px] h-[18px]" />;
            case 'warning': return <AlertTriangle className="w-[18px] h-[18px]" />;
            default:        return <Info          className="w-[18px] h-[18px]" />;
        }
    };

    return (
        <div
            className={`toast-item ${notification.type} ${isPaused ? 'paused' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ '--toast-duration': `${duration}ms` } as React.CSSProperties}
        >
            <div className="toast-icon">{getIcon()}</div>

            <div className="toast-content">
                {notification.title && (
                    <p className="toast-title">{notification.title}</p>
                )}
                <p className="toast-message">{notification.message}</p>
            </div>

            <button className="toast-close" onClick={remove}>
                <X size={13} />
            </button>

            <div className="toast-progress-bar">
                <div
                    className="progress-fill"
                    style={{
                        animationDuration: `${duration}ms`,
                        animationPlayState: isPaused ? 'paused' : 'running'
                    }}
                />
            </div>
        </div>
    );
};

const MAX_VISIBLE = 3;

export const ToastContainer: React.FC = () => {
    const { notifications, removeNotification } = useToast();

    let currentUser: { role?: string } | null = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const proc = useProcurement();
        currentUser = proc.currentUser;
    } catch { /* ok */ }

    if (!notifications || notifications.length === 0) return null;

    const filteredNotifications = notifications.filter((n: Notification) =>
        !n.role || (currentUser && n.role === currentUser.role)
    );

    if (filteredNotifications.length === 0) return null;

    const visible = filteredNotifications.slice(-MAX_VISIBLE);
    const hiddenCount = filteredNotifications.length - visible.length;

    return (
        <div className="toast-container-global">
            {hiddenCount > 0 && (
                <div className="toast-stack-counter">
                    +{hiddenCount} thông báo khác
                </div>
            )}
            {visible.map((t) => (
                <ToastItem key={t.id} notification={t} onRemove={removeNotification} />
            ))}
            <style jsx global>{`
                .toast-container-global {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column-reverse;
                    gap: 10px;
                    max-width: 380px;
                    width: calc(100% - 48px);
                    pointer-events: none;
                }

                .toast-stack-counter {
                    text-align: center;
                    font-size: 11px;
                    font-weight: 600;
                    color: #64748B;
                    background: #F1F5F9;
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                    padding: 6px 12px;
                    pointer-events: auto;
                    cursor: pointer;
                }

                .toast-item {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    padding: 14px 16px;
                    background: #FFFFFF;
                    border-radius: 10px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06);
                    overflow: hidden;
                    pointer-events: auto;
                    border: 1px solid #E2E8F0;
                    transition: transform 0.2s, box-shadow 0.2s;
                    animation: toast-slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes toast-slide-up {
                    from { transform: translateY(16px); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }

                .toast-item.success { border-left: 4px solid #10B981; }
                .toast-item.error   { border-left: 4px solid #EF4444; animation: toast-slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1), shake 0.4s ease-in-out 0.3s; }
                .toast-item.warning { border-left: 4px solid #F59E0B; }
                .toast-item.info    { border-left: 4px solid #2563EB; }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25%      { transform: translateX(-4px); }
                    75%      { transform: translateX(4px); }
                }

                .toast-item:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }

                /* Icon — solid colored square background */
                .toast-icon {
                    margin-right: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    margin-top: 1px;
                }

                .success .toast-icon { background: #ECFDF5; color: #059669; }
                .error   .toast-icon { background: #FEF2F2; color: #DC2626; }
                .warning .toast-icon { background: #FFFBEB; color: #D97706; }
                .info    .toast-icon { background: #EFF6FF; color: #2563EB; }

                .toast-content { flex: 1; padding-right: 8px; min-width: 0; }

                .toast-title {
                    margin: 0 0 2px;
                    font-size: 13px;
                    font-weight: 700;
                    color: #0F172A;
                    line-height: 1.3;
                }

                .toast-message {
                    margin: 0;
                    font-size: 12px;
                    font-weight: 400;
                    color: #64748B;
                    line-height: 1.4;
                    font-family: var(--font-sans);
                }

                .toast-close {
                    background: rgba(0,0,0,0.04);
                    border: none;
                    color: #94A3B8;
                    cursor: pointer;
                    width: 26px;
                    height: 26px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s;
                    flex-shrink: 0;
                    margin-top: 1px;
                }

                .toast-close:hover {
                    background: #FEF2F2;
                    color: #DC2626;
                    transform: rotate(90deg);
                }

                /* Progress Bar */
                .toast-progress-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background: transparent;
                }

                .progress-fill {
                    height: 100%;
                    width: 100%;
                    transform-origin: left;
                    animation: progress-shrink linear forwards;
                }

                .success .progress-fill { background: #10B981; }
                .error   .progress-fill { background: #EF4444; }
                .warning .progress-fill { background: #F59E0B; }
                .info    .progress-fill { background: #2563EB; }

                @keyframes progress-shrink {
                    from { transform: scaleX(1); }
                    to   { transform: scaleX(0); }
                }
            `}</style>
        </div>
    );
};

export default ToastContainer;
