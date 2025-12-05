import React, { useState } from 'react';
import { useTaskStore, useAuthStore, useAppStore } from '../store';
import { UI_LABELS } from '../constants';
import { Card, Button, Input, Select, Tabs } from './DesignSystem';
import { TaskType, Task } from '../types';
import { CheckCircle2, Circle, Calendar as CalendarIcon, Clock, Bell } from 'lucide-react';
import { useNotifications } from '../hooks';

const ChecklistItem = ({ task, onToggle }: { task: Task, onToggle: () => void }) => (
    <div 
        onClick={onToggle}
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            task.isCompleted 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-app-card border-app-border hover:border-primary/50'
        }`}
    >
        {task.isCompleted 
            ? <CheckCircle2 className="text-green-500" size={24} /> 
            : <Circle className="text-app-text-muted" size={24} />
        }
        <div className="flex-1">
            <p className={`font-medium ${task.isCompleted ? 'text-app-text-muted line-through' : 'text-app-text'}`}>
                {task.title}
            </p>
            {task.type === TaskType.EVENT && (
                <p className="text-xs text-primary flex items-center gap-1 mt-1">
                    <CalendarIcon size={12} /> {new Date(task.date).toLocaleDateString()}
                </p>
            )}
        </div>
    </div>
);

export const FamilyDashboard = () => {
    const { language, tenantId } = useAppStore();
    const { tasks, addTask, toggleTaskCompletion, deleteTask } = useTaskStore();
    const { profiles, currentUser } = useAuthStore();
    const { permission, requestPermission } = useNotifications();
    const labels = UI_LABELS[language];

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [taskType, setTaskType] = useState<TaskType>(TaskType.DAILY);
    const [assignTo, setAssignTo] = useState(currentUser?.id || '');

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle) return;
        await addTask(newTaskTitle, Date.now(), taskType, assignTo, tenantId);
        setNewTaskTitle('');
    };

    // Simple grouping
    const dailyTasks = tasks.filter(t => t.type === TaskType.DAILY);
    const events = tasks.filter(t => t.type === TaskType.EVENT || t.type === TaskType.TODO).sort((a,b) => a.date - b.date);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Notifications Banner */}
            {permission !== 'granted' && (
                <div onClick={requestPermission} className="bg-primary/10 border border-primary/30 p-3 rounded-xl flex items-center gap-3 cursor-pointer">
                    <Bell size={20} className="text-primary" />
                    <span className="text-sm font-medium text-primary">{labels.enableNotifications}</span>
                </div>
            )}

            {/* Daily Checklist */}
            <section>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-app-text flex items-center gap-2">
                        <Clock size={18} className="text-accent" />
                        {labels.dailyChecklist}
                    </h3>
                    <span className="text-xs text-app-text-muted">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="space-y-2">
                    {dailyTasks.map(task => (
                        <ChecklistItem 
                            key={task.id} 
                            task={task} 
                            onToggle={() => task.id && toggleTaskCompletion(task.id, tenantId)} 
                        />
                    ))}
                    {dailyTasks.length === 0 && (
                        <p className="text-sm text-app-text-muted italic p-2">{labels.emptyState}</p>
                    )}
                </div>
            </section>

            {/* Upcoming Events/Tasks */}
            <section>
                <h3 className="font-bold text-app-text mb-2 flex items-center gap-2">
                    <CalendarIcon size={18} className="text-secondary" />
                    {labels.calendar} & {labels.tasks}
                </h3>
                <div className="space-y-2">
                    {events.map(task => (
                        <ChecklistItem 
                            key={task.id} 
                            task={task} 
                            onToggle={() => task.id && toggleTaskCompletion(task.id, tenantId)} 
                        />
                    ))}
                </div>
            </section>

            {/* Quick Add Task */}
            <Card className="border-accent/20">
                <h4 className="font-bold text-sm text-app-text mb-3">{labels.addTask}</h4>
                <form onSubmit={handleAddTask} className="space-y-3">
                    <Input 
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        placeholder={labels.taskTitle}
                        className="!py-2"
                    />
                    <div className="flex gap-2">
                        <div className="flex-1">
                             <Select 
                                value={taskType}
                                onChange={e => setTaskType(e.target.value as TaskType)}
                                options={[
                                    { value: TaskType.DAILY, label: 'Diário' },
                                    { value: TaskType.TODO, label: 'Tarefa' },
                                    { value: TaskType.EVENT, label: 'Evento' }
                                ]}
                                className="!py-2 !text-xs"
                            />
                        </div>
                        <div className="flex-1">
                            <Select 
                                value={assignTo}
                                onChange={e => setAssignTo(e.target.value)}
                                options={profiles.map(p => ({ value: p.id, label: p.name }))}
                                className="!py-2 !text-xs"
                            />
                        </div>
                    </div>
                    <Button type="submit" variant="secondary" className="w-full !py-2">
                        {labels.save}
                    </Button>
                </form>
            </Card>
        </div>
    );
};
