import { useEffect, useState } from 'react';
import { Sidebar } from '../../widgets/Sidebar';
import { LevelCard } from './components/LevelCard';
import { getLevels } from './api';
import { levelStatusOf, type Level } from './types';
import './LevelsPage.less';

const LevelsPage: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getLevels();
        // Скрытые уровни игрок вообще не видит - их решает серверный статус.
        setLevels(((response.data ?? []) as Level[]).filter((level) => levelStatusOf(level) !== 'hidden'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить уровни');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLevels();
  }, []);

  const totalLevels = levels.length;
  const availableLevels = levels.filter((level) => levelStatusOf(level) === 'available').length;
  const progressPercent = totalLevels > 0 ? (availableLevels / totalLevels) * 100 : 0;

  return (
    <div className="levels-layout">
      <Sidebar />
      <div className="levels-content">
        <header className="levels-hero">
          <div className="levels-hero__text">
            <span className="levels-hero__eyebrow">RoboCode · Python</span>
            <h1>Уровни</h1>
            <p>
              Веди робота через лабиринт к выходу. Собери ключ, считай тики и строки - из них складывается
              балл. Каждый уровень открывает новые команды языка: от простого <code>robot.move()</code> до
              циклов и своих функций.
            </p>
          </div>
          <div className="levels-hero__progress">
            <div className="levels-hero__numbers">
              <strong>{availableLevels}/{totalLevels}</strong>
              <span>уровней доступно</span>
            </div>
            <div className="levels-progress">
              <i style={{ width: `${progressPercent}%` }} />
            </div>
            <small>Заблокированные открывает администратор в конструкторе уровней</small>
          </div>
        </header>

        {isLoading && (
          <div className="levels-state">
            <span className="levels-spinner" />
            Загрузка уровней...
          </div>
        )}

        {!isLoading && error && (
          <div className="levels-state levels-state--error">
            <strong>Ошибка загрузки</strong>
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && levels.length === 0 && (
          <div className="levels-state">Уровни пока не добавлены.</div>
        )}

        {!isLoading && !error && levels.length > 0 && (
          <div className="levels-grid">
            {levels.map((level) => (
              <LevelCard key={`${level.levelId ?? level.id}`} level={level} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelsPage;
