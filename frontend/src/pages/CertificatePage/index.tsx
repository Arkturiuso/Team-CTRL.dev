import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flex, Box, Text } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';
import { getCertificate, type CertificateData } from './api';
import { parseServerDate } from '../../utils/date';

// Страница "Справка о прохождении уровня" - выходной документ по эталону.
const CertificatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const levelId = Number(id);

  const [data, setData] = useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getCertificate(levelId);
        if (!cancelled) setData(result);
      } catch (err) {
        // Ошибка сети или 401: показываем пустоту, а не падение страницы.
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : 'Сервер не отдаёт справку');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [levelId]);

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '24px',
    padding: '12px 4px',
    borderBottom: '1px dashed #E5E7EB',
    fontSize: '15px',
  };

  // Дату показываем только если сервер реально прислал fixedAt.
  const fixedDate = data?.fixedAt ? parseServerDate(data.fixedAt) : null;
  const fixedDateText = fixedDate && !Number.isNaN(fixedDate.getTime())
    ? fixedDate.toLocaleString('ru-RU')
    : null;

  // Знаменатель ключей печатаем только когда сервер прислал keysTotal.
  const keysText = `${data?.keysCollected ?? '—'}${typeof data?.keysTotal === 'number' ? `/${data.keysTotal}` : ''}`;

  return (
    <Flex style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      <Sidebar />
      <Box className="page-content" style={{ flex: 1, padding: '40px 48px', maxWidth: '760px' }}>
        <button
          onClick={() => navigate(`/user/levels/${levelId}`)}
          style={{
            background: 'transparent', border: '1px solid #D1D5DB', borderRadius: '8px',
            padding: '8px 14px', fontSize: '13px', cursor: 'pointer', marginBottom: '20px',
          }}
        >
          ← К уровню
        </button>

        {isLoading && <Text color="gray">Загрузка справки…</Text>}

        {!isLoading && !data && (
          <Box style={{
            background: 'white', borderRadius: '14px', padding: '48px 24px',
            textAlign: 'center', border: '2px dashed #E5E7EB',
          }}>
            <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
              Справка не загрузилась
            </Text>
            <Text size="2" color="gray">
              {error ?? 'Не удалось загрузить справку.'}
            </Text>
          </Box>
        )}

        {!isLoading && data && !data.hasResult && (
          <Box style={{
            background: 'white', borderRadius: '14px', padding: '48px 24px',
            textAlign: 'center', border: '2px dashed #E5E7EB',
          }}>
            <Text size="3" weight="bold" style={{ display: 'block', marginBottom: '8px' }}>
              Результата по уровню {data.levelId} пока нет
            </Text>
            <Text size="2" color="gray" style={{ display: 'block', marginBottom: '4px' }}>
              {data.levelName ?? ''}
            </Text>
            <Text size="2" color="gray">
              Справка появится после первого успешного прохождения уровня.
            </Text>
          </Box>
        )}

        {!isLoading && data && data.hasResult && (
          <Box className="cert-card" style={{ background: 'white', borderRadius: '16px', padding: '32px 36px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <Text size="1" weight="bold" style={{ letterSpacing: '1.4px', textTransform: 'uppercase', color: '#0F766E', display: 'block', marginBottom: '8px' }}>
              RoboCode · выходной документ
            </Text>
            <Text size="6" weight="bold" style={{ fontSize: '22px', display: 'block', marginBottom: '4px' }}>
              Справка о прохождении уровня {data.levelId}
            </Text>
            <Text size="3" color="gray" style={{ display: 'block', marginBottom: '24px' }}>
              {data.levelName ?? ''}
            </Text>

            <div className="cert-row" style={rowStyle}><span>Тиков затрачено</span><strong>{data.tickCount ?? '—'}</strong></div>
            <div className="cert-row" style={rowStyle}><span>Строк кода (без пустых и комментариев)</span><strong>{data.linesCount ?? '—'}</strong></div>
            <div className="cert-row" style={rowStyle}><span>Ключей собрано</span><strong>{keysText}</strong></div>
            {data.difficulty && <div className="cert-row" style={rowStyle}><span>Сложность</span><strong>{data.difficulty}</strong></div>}
            <div className="cert-row" style={rowStyle}><span>Итоговый балл</span><strong>{data.score ?? '—'}</strong></div>
            {fixedDateText && (
              <div className="cert-row" style={{ ...rowStyle, borderBottom: 'none' }}>
                <span>Дата фиксации</span>
                <strong>{fixedDateText}</strong>
              </div>
            )}

            <Text size="1" color="gray" style={{ display: 'block', marginTop: '20px' }}>
              Балл: сложность ×100 − 2×тики − 5×строки.
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
};

export default CertificatePage;
