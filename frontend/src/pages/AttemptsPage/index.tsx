import { useEffect, useState } from 'react';
import { Flex, Box, Text, Badge } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';
import { getAttempts, type AttemptItem } from './api';
import { parseServerDate } from '../../utils/date';

// Справка об истории попыток игрока: GET /api/attempts?levelId=&page=
const AttemptsPage: React.FC = () => {
  const levelIdParam = new URLSearchParams(window.location.search).get('levelId');
  const levelIdFilter = levelIdParam ? Number(levelIdParam) : null;

  const [items, setItems] = useState<AttemptItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCode, setOpenCode] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAttempts(levelIdFilter, page);
        if (cancelled) return;
        setItems(data?.items ?? []);
        setTotalPages(data?.totalPages ?? 1);
      } catch (err) {
        // Ошибка сети или 401: показываем пустоту, а не падение страницы.
        if (!cancelled) {
          setItems([]);
          setError(err instanceof Error ? err.message : 'Не удалось загрузить попытки');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page, levelIdFilter]);

  const toggleCode = (id: string) => {
    setOpenCode((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusBadge = (status: string) => {
    const raw = (status ?? '').toLowerCase();
    if (raw.includes('success') || raw.includes('успех')) return { color: 'green' as const, text: 'Успешно' };
    if (raw.includes('error') || raw.includes('ошибк')) return { color: 'red' as const, text: 'Ошибка' };
    return { color: 'yellow' as const, text: 'В процессе' };
  };

  return (
    <Flex style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      <Sidebar />
      <Box className="page-content" style={{ flex: 1, padding: '40px 48px', maxWidth: '1100px' }}>
        <Text size="7" weight="bold" style={{ fontSize: '26px', color: '#111827', display: 'block', marginBottom: '6px' }}>
          История попыток
        </Text>
        <Text size="2" color="gray" style={{ display: 'block', marginBottom: '24px' }}>
          {levelIdFilter
            ? `Попытки по уровню ${levelIdFilter}`
            : 'Все твои прогоны кода: исходник, статус, тики и строки'}
        </Text>

        {isLoading && <Text color="gray">Загрузка…</Text>}

        {!isLoading && items.length === 0 && (
          <Box style={{
            background: 'white', borderRadius: '12px', padding: '48px 24px',
            textAlign: 'center', border: '2px dashed #E5E7EB',
          }}>
            <Text size="3" weight="medium" style={{ display: 'block', marginBottom: '8px' }}>
              Попыток пока нет
            </Text>
            <Text size="2" color="gray">
              {error ? `История не загрузилась: ${error}` : 'Запусти код на уровне - попытка появится здесь.'}
            </Text>
          </Box>
        )}

        {!isLoading && items.length > 0 && (
          <Box style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((attempt) => {
              const key = String(attempt.attemptId);
              const badge = statusBadge(attempt.status);
              return (
                <Box key={key} className="attempt-card" style={{ background: 'white', borderRadius: '12px', padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <Flex align="center" justify="between" wrap="wrap" style={{ gap: '12px' }}>
                    <Box className="attempt-card__info">
                      <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
                        Попытка №{attempt.attemptId} · {attempt.levelName ?? `Уровень ${attempt.levelId}`}
                      </Text>
                      <Text size="1" color="gray">
                        {attempt.submitted ? parseServerDate(attempt.submitted).toLocaleString('ru-RU') : '—'} · тики {attempt.ticks} · строк {attempt.linesCount}
                      </Text>
                    </Box>
                    <Flex align="center" style={{ gap: '10px' }}>
                      <Badge color={badge.color} variant="soft" size="2">{badge.text}</Badge>
                      <button
                        onClick={() => toggleCode(key)}
                        style={{
                          background: 'transparent', border: '1px solid #D1D5DB', borderRadius: '8px',
                          padding: '6px 12px', fontSize: '13px', cursor: 'pointer', color: '#374151',
                        }}
                      >
                        {openCode.has(key) ? 'Скрыть код' : 'Показать код'}
                      </button>
                    </Flex>
                  </Flex>
                  {openCode.has(key) && (
                    <pre style={{
                      margin: 0,
                      marginTop: '12px', padding: '14px', background: '#0b1220', color: '#d7e4f6',
                      borderRadius: '10px', fontSize: '13px', fontFamily: 'ui-monospace, monospace',
                      overflowX: 'auto', whiteSpace: 'pre',
                    }}>
                      {attempt.sourceCode || '# пустой код'}
                    </pre>
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {!isLoading && totalPages > 1 && (
          <Flex className="attempt-pager" justify="center" align="center" style={{ gap: '14px', marginTop: '28px' }}>
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              style={{ padding: '10px 18px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
            >
              ← Назад
            </button>
            <Text size="2" color="gray">страница {page} из {totalPages}</Text>
            <button
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
              style={{ padding: '10px 18px', border: '1px solid #D1D5DB', borderRadius: '8px', background: 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Вперёд →
            </button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
};

export default AttemptsPage;
