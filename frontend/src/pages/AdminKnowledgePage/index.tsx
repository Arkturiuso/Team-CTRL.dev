import { useState, useEffect } from 'react';
import { Box, Text, Flex, Badge, Button } from '@radix-ui/themes';
import { Sidebar } from '../../widgets/Sidebar';
import { getAllCommands, createCommand, updateCommand, deleteCommand, type Command } from './api';

const AdminKnowledgePage: React.FC = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    syntax: '',
    description: ''
  });

  const loadCommands = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllCommands();
      setCommands(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить команды');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommands();
  }, []);

  const handleCreate = () => {
    setEditingCommand(null);
    setFormData({ name: '', syntax: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = (command: Command) => {
    setEditingCommand(command);
    setFormData({
      name: command.name,
      syntax: command.syntax,
      description: command.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (commandId: number, commandName: string) => {
    if (!confirm(`Удалить команду "${commandName}"? Это действие нельзя отменить.`)) return;

    try {
      await deleteCommand(commandId);
      await loadCommands();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось удалить команду. Возможно, она используется в уровнях.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.syntax.trim()) {
      alert('Название и синтаксис обязательны');
      return;
    }

    try {
      if (editingCommand) {
        await updateCommand(editingCommand.commandId, {
          syntax: formData.syntax,
          description: formData.description
        });
      } else {
        await createCommand({
          name: formData.name,
          syntax: formData.syntax,
          description: formData.description
        });
      }
      setShowModal(false);
      await loadCommands();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка при сохранении');
    }
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ height: '100vh', background: '#F9FAFB' }}>
        <Text size="3" color="gray">Загрузка...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}>
        <Sidebar />
        <Flex align="center" justify="center" style={{ flex: 1 }}>
          <Box style={{ background: 'white', padding: '32px', borderRadius: '12px', textAlign: 'center' }}>
            <Text color="red" size="4" weight="bold" style={{ display: 'block', marginBottom: '12px' }}>Ошибка</Text>
            <Text color="gray" size="2">{error}</Text>
          </Box>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Sidebar />

      <Box style={{ flex: 1, padding: '48px', overflowY: 'auto', maxWidth: '1200px' }}>
        <Flex align="center" justify="between" style={{ marginBottom: '40px' }}>
          <Box>
            <Text size="8" weight="bold" style={{ fontSize: '32px', color: '#111827', display: 'block', marginBottom: '8px' }}>
              База знаний
            </Text>
            <Text size="3" color="gray">Управление командами системы</Text>
          </Box>
          <Flex gap="12px">
            <Badge color="orange" variant="soft" size="3" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600 }}>
              Режим администратора
            </Badge>
            <Button
              size="3"
              onClick={handleCreate}
              style={{
                background: '#3B82F6', color: 'white', border: 'none',
                borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
            >
              + Добавить команду
            </Button>
          </Flex>
        </Flex>

        <Box style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Flex align="center" justify="between" style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '2px solid #F3F4F6' }}>
            <Text size="5" weight="bold" style={{ fontSize: '20px', color: '#111827' }}>
              Все команды системы
            </Text>
            <Badge color="gray" variant="soft" size="3" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '14px' }}>
              Всего: {commands.length}
            </Badge>
          </Flex>

          {commands.length === 0 ? (
            <Flex justify="center" align="center" style={{ minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
              <Text size="7">📦</Text>
              <Text size="3" color="gray" weight="medium">Команды не найдены</Text>
            </Flex>
          ) : (
            <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {commands.map((cmd) => (
                <Box
                  key={cmd.commandId}
                  style={{
                    background: '#FFFFFF',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '24px 28px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3B82F6';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Box style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#EFF6FF',
                    border: '2px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Text size="5" style={{ fontFamily: 'monospace', color: '#3B82F6', fontWeight: 700 }}>
                      {cmd.commandId}
                    </Text>
                  </Box>

                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Flex align="center" gap="10px" style={{ marginBottom: '6px', flexWrap: 'wrap' }}>
                      <Text size="4" weight="bold" style={{
                        fontFamily: 'monospace',
                        color: '#1E40AF',
                        background: '#DBEAFE',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '15px'
                      }}>
                        {cmd.syntax}
                      </Text>
                      <Badge color="blue" variant="soft" size="2" style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                        {cmd.name}
                      </Badge>
                    </Flex>
                    <Text size="2" color="gray" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      {cmd.description || 'Описание отсутствует'}
                    </Text>
                  </Box>

                  <Flex gap="10px" style={{ flexShrink: 0 }}>
                    <Button
                      size="2"
                      variant="soft"
                      color="blue"
                      onClick={() => handleEdit(cmd)}
                      style={{ padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                    >
                      ✏️ Изменить
                    </Button>
                    <Button
                      size="2"
                      variant="soft"
                      color="red"
                      onClick={() => handleDelete(cmd.commandId, cmd.name)}
                      style={{ padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                    >
                      🗑️ Удалить
                    </Button>
                  </Flex>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Модалка создания/редактирования */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '32px',
            maxWidth: '560px', width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#111827', fontWeight: 700 }}>
              {editingCommand ? 'Редактировать команду' : 'Создать команду'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Название (латиницей, без пробелов) *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="например: move_right"
                  disabled={!!editingCommand}
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '2px solid #E5E7EB', borderRadius: '8px',
                    fontSize: '14px', boxSizing: 'border-box', outline: 'none',
                    background: editingCommand ? '#F9FAFB' : 'white',
                    cursor: editingCommand ? 'not-allowed' : 'text'
                  }}
                />
                {editingCommand && (
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                    Название нельзя изменить после создания
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Синтаксис *
                </label>
                <input
                  type="text"
                  value={formData.syntax}
                  onChange={(e) => setFormData({ ...formData, syntax: e.target.value })}
                  placeholder="например: move_right()"
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '2px solid #E5E7EB', borderRadius: '8px',
                    fontSize: '14px', boxSizing: 'border-box', outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание команды для игрока..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '2px solid #E5E7EB', borderRadius: '8px',
                    fontSize: '14px', resize: 'vertical', boxSizing: 'border-box',
                    fontFamily: 'inherit', outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #F3F4F6' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '12px 24px', border: '2px solid #E5E7EB', borderRadius: '10px',
                  background: 'white', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '12px 28px', border: 'none', borderRadius: '10px',
                  background: '#3B82F6', color: 'white', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                }}
              >
                {editingCommand ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Flex>
  );
};

export default AdminKnowledgePage;
