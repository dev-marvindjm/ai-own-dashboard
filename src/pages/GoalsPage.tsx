import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useGoals } from '@/hooks/useApi';
import { Target, Play, Pause, Trash2, Plus } from 'lucide-react';

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Trading Goals</h1>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={16} /> Create Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading goals...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal: any) => {
            const progressPct = Math.min(100, Math.round((goal.current / goal.target) * 100));
            return (
              <Card key={goal.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 h-1 bg-blue-500 w-[${progressPct}%] transition-all duration-500`} style={{ width: `${progressPct}%` }} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="secondary" className="mb-2">{goal.scope.toUpperCase()} - {goal.scope_name}</Badge>
                      <CardTitle className="text-xl">{goal.target_type}</CardTitle>
                    </div>
                    <Badge variant={goal.status === 'active' ? 'default' : 'outline'} className={goal.status === 'active' ? 'bg-blue-500' : ''}>
                      {goal.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-500">Progress</span>
                      <span className="font-bold">{goal.current} / {goal.target}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progressPct}%` }}></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/50 pt-4 rounded-b-xl">
                  {goal.status === 'active' ? (
                    <Button variant="ghost" size="sm" className="gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"><Pause size={14} /> Pause</Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"><Play size={14} /> Resume</Button>
                  )}
                  <Button variant="ghost" size="sm" className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14} /> Delete</Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Goal">
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Scope</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="global">Global</option>
              <option value="broker">Specific Broker</option>
              <option value="sender">Specific Sender</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Type</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="profit">Total Profit ($)</option>
              <option value="win_rate">Win Rate (%)</option>
              <option value="trades">Number of Trades</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Amount/Quantity</label>
            <Input type="number" placeholder="e.g. 1000" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsModalOpen(false)}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
