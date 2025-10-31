import { NavLink, useLocation, useNavigate } from "react-router-dom";
import ChatHistoryItem from "./utils/ChatHistoryItem";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAxios } from '../../services/AxiosConfig';
import DeletePopup from "./utils/DeletePopup";

function ChatHistory({ sessionList, setChatList }: { sessionList: Array<{ sessionId: string, sessionName: string | null}>, setChatList: Function }) {
    const axiosInstance = useAxios();
    const navigate = useNavigate();
    const location = useLocation();
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteMode, setDeleteMode] = useState<'all' | 'single'>('all');
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    // Infinite scroll + paging state
    const [page, setPage] = useState<number>(1);
    const pageRef = useRef<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const initLoadedRef = useRef<boolean>(false);
    const loadedPagesRef = useRef<Set<number>>(new Set());
    const containerRef = useRef<HTMLDivElement | null>(null);
    const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const LIMIT = 20;

    // Unified page loader with guards
    const loadPage = useCallback(async (targetPage: number) => {
        if (isFetching) return;
        if (!hasMore && targetPage !== 1) return; // allow reload from 1 even if hasMore false
        if (loadedPagesRef.current.has(targetPage)) return;
        try {
            setIsFetching(true);
            const controller = new AbortController();
            const response = await axiosInstance.get('/chat_history', {
                params: { page: targetPage, limit: LIMIT },
                signal: controller.signal as any,
            });
            const sessions = Array.isArray(response.data) ? response.data : [response.data];
            const formatted = sessions.map((item: any) => ({
                sessionId: item.id,
                sessionName: item.session_name,
            }));
            setChatList((prev: Array<{ sessionId: string; sessionName: string | null }>) => {
                const seen = new Set(prev.map((s) => s.sessionId));
                const incoming = formatted.filter((s) => !seen.has(s.sessionId));
                return [...prev, ...incoming];
            });
            loadedPagesRef.current.add(targetPage);
            setPage(targetPage);
            pageRef.current = targetPage;
            if (formatted.length < LIMIT) setHasMore(false);
            else setHasMore(true);
        } catch (error) {
            console.error('Error fetching chat sessions:', error);
        } finally {
            setIsFetching(false);
        }
    }, [LIMIT, axiosInstance, hasMore, isFetching, setChatList]);

    // Initial fetch with StrictMode guard
    useEffect(() => {
        if (initLoadedRef.current) return;
        initLoadedRef.current = true;
        loadedPagesRef.current.clear();
        pageRef.current = 0;
        setPage(0);
        setHasMore(true);
        loadPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadPage]);

    // IntersectionObserver for bottom sentinel
    useEffect(() => {
        const el = containerRef.current;
        const sentinel = bottomSentinelRef.current;
        if (!el || !sentinel) return;

        const onIntersect: IntersectionObserverCallback = (entries) => {
            const [entry] = entries;
            if (!entry.isIntersecting) return;
            if (!hasMore || isFetching) return;
            // Debounce rapid intersections
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(async () => {
                const nextPage = pageRef.current + 1;
                await loadPage(nextPage);
            }, 200);
        };

        const observer = new IntersectionObserver(onIntersect, {
            root: el,
            threshold: 0,
            rootMargin: '0px 0px 200px 0px',
        });
        observer.observe(sentinel);

        // Fallback: manual scroll listener
        const onScroll = () => {
            if (!hasMore || isFetching) return;
            const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
            if (!nearBottom) return;
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(async () => {
                const nextPage = pageRef.current + 1;
                await loadPage(nextPage);
            }, 200);
        };
        el.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            observer.disconnect();
            el.removeEventListener('scroll', onScroll as any);
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [hasMore, isFetching, loadPage]);

    return (
        <div className="flex h-full min-h-0 flex-col p-2.5 gap-2.5">
            <NavLink className="flex w-full items-center justify-center text-center p-2.5 rounded-4xl bg-brandColor text-basePrimary font-semibold shadow-md gap-1 text-textMedium" to="/chat" onClick={(e) => {
                // Prevent re-navigation if already on the same page
                if (window.location.pathname === `/chat`) {
                    e.preventDefault();
                }
            }}>
                <i className="ri-add-line"></i>New Chat
            </NavLink>
            <div className="flex flex-row justify-between">
                <p className="text-textBig font-semibold">Chats</p>
                <button
                    className="text-textMediumSmall text-textSecondary cursor-pointer hover:underline"
                    onClick={() => {
                        setDeleteMode('all');
                        setSelectedSessionId(null);
                        setShowDeletePopup(true);
                    }}
                >
                    Clear All
                </button>
            </div>
            <div ref={containerRef} className="flex-1 gap-0 flex flex-col overflow-y-auto  scrollbar-thin scrollbar-thumb-textSecondary scrollbar-thumb-rounded-3xl">
                {sessionList.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-textSecondary text-md">
                        {isFetching ? (
                            <div className="flex items-center gap-2">
                                <span className="ai-loader" />
                                <span>Loading chats…</span>
                            </div>
                        ) : (
                            'No Chat History'
                        )}
                    </div>
                ) : (
                    sessionList.map((session) => (
                        <ChatHistoryItem
                            key={session.sessionId}
                            sessionId={session.sessionId}
                            sessionName={session.sessionName}
                            onDeleteClick={(sid: string) => {
                                setDeleteMode('single');
                                setSelectedSessionId(sid);
                                setShowDeletePopup(true);
                            }}
                        />
                    ))
                )}
                {/* Bottom sentinel for infinite scroll */}
                {sessionList.length > 0 && isFetching && (
                    <div className="flex justify-center items-center py-3 text-textSecondary">
                        <span className="ai-loader mr-2" />
                        <span>Loading more…</span>
                    </div>
                )}
                <div ref={bottomSentinelRef} className="h-1" />
            </div>
            <DeletePopup
                isOpen={showDeletePopup}
                mode={deleteMode}
                sessionId={selectedSessionId}
                onClose={() => setShowDeletePopup(false)}
                onSuccess={useCallback((mode, sid) => {
                    const match = location.pathname.match(/^\/chat\/([^/]+)$/);
                    const activeSessionId = match ? match[1] : null;

                    if (mode === 'all') {
                        setChatList([]);
                        // Reset paging so user can load again
                        loadedPagesRef.current.clear();
                        pageRef.current = 0;
                        setPage(0);
                        setHasMore(true);
                        // Kick off fresh load of page 1
                        loadPage(1);
                        // If currently viewing a specific chat, navigate back to /chat
                        if (activeSessionId) {
                            navigate('/chat', { replace: true });
                        }
                    } else if (mode === 'single' && sid) {
                        setChatList((prev: Array<{ sessionId: string, sessionName: string | null}>) =>
                            prev.filter((s) => s.sessionId !== sid)
                        );
                        // If the deleted session is the one currently open, navigate back to /chat
                        if (activeSessionId === sid) {
                            navigate('/chat', { replace: true });
                        }
                    }
                }, [location.pathname, navigate, setChatList, loadPage])}
            />
        </div>
    );
}

export default ChatHistory;