import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import type { Subject, InsertSubject } from '@shared/schema';

export default function SubjectsSection() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState<InsertSubject>({
    name: '',
    arabicName: '',
    code: '',
    description: '',
  });

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (data: InsertSubject) => {
      const subjectData = {
        ...data,
        name: data.arabicName,
      };
      return await apiRequest('POST', '/api/subjects', subjectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setIsAddDialogOpen(false);
      setNewSubject({ name: '', arabicName: '', code: '', description: '' });
      toast({
        title: 'تم إضافة المادة',
        description: 'تم إضافة المادة الدراسية بنجاح',
      });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Subject> }) => {
      const subjectData = {
        ...data,
        name: data.arabicName || data.name,
      };
      return await apiRequest('PATCH', `/api/subjects/${id}`, subjectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setIsEditDialogOpen(false);
      setEditingSubject(null);
      toast({
        title: 'تم تحديث المادة',
        description: 'تم تحديث المادة الدراسية بنجاح',
      });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      toast({
        title: 'تم حذف المادة',
        description: 'تم حذف المادة الدراسية بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ في الحذف',
        description: 'لا يمكن حذف المادة لأنها مستخدمة في الصفوف الدراسية',
        variant: 'destructive',
      });
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSubjectMutation.mutate(newSubject);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject.id, data: editingSubject });
    }
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة المواد الدراسية</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            المواد الدراسية ({subjects.length})
          </CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-subject">
            <Plus className="h-4 w-4 ml-2" />
            إضافة مادة دراسية
          </Button>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">لا توجد مواد دراسية مضافة</p>
              <p className="text-sm mt-2">ابدأ بإضافة المواد الدراسية للمدرسة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <Card key={subject.id} data-testid={`card-subject-${subject.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{subject.arabicName}</CardTitle>
                        {subject.code && (
                          <Badge variant="secondary" className="mt-2">
                            {subject.code}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {subject.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {subject.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(subject)}
                        data-testid={`button-edit-subject-${subject.id}`}
                      >
                        <Edit className="h-3 w-3 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteSubjectMutation.mutate(subject.id)}
                        disabled={deleteSubjectMutation.isPending}
                        data-testid={`button-delete-subject-${subject.id}`}
                      >
                        <Trash2 className="h-3 w-3 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Subject Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إضافة مادة دراسية جديدة
            </DialogTitle>
            <DialogDescription>أدخل معلومات المادة الدراسية الجديدة</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">اسم المادة بالعربية *</label>
              <Input
                value={newSubject.arabicName}
                onChange={(e) => setNewSubject({ ...newSubject, arabicName: e.target.value })}
                placeholder="مثال: الرياضيات"
                required
                data-testid="input-subject-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">كود المادة</label>
              <Input
                value={newSubject.code}
                onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                placeholder="مثال: MATH101"
                data-testid="input-subject-code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <Textarea
                value={newSubject.description ?? ''}
                onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                placeholder="وصف المادة الدراسية"
                rows={3}
                data-testid="input-subject-description"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createSubjectMutation.isPending}
              data-testid="button-submit-subject"
            >
              {createSubjectMutation.isPending ? 'جاري الإضافة...' : 'إضافة المادة'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              تعديل المادة الدراسية
            </DialogTitle>
            <DialogDescription>قم بتعديل معلومات المادة الدراسية</DialogDescription>
          </DialogHeader>
          {editingSubject && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">اسم المادة بالعربية *</label>
                <Input
                  value={editingSubject.arabicName}
                  onChange={(e) =>
                    setEditingSubject({ ...editingSubject, arabicName: e.target.value })
                  }
                  placeholder="مثال: الرياضيات"
                  required
                  data-testid="input-edit-subject-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">كود المادة</label>
                <Input
                  value={editingSubject.code ?? ''}
                  onChange={(e) =>
                    setEditingSubject({ ...editingSubject, code: e.target.value })
                  }
                  placeholder="مثال: MATH101"
                  data-testid="input-edit-subject-code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الوصف</label>
                <Textarea
                  value={editingSubject.description ?? ''}
                  onChange={(e) =>
                    setEditingSubject({ ...editingSubject, description: e.target.value })
                  }
                  placeholder="وصف المادة الدراسية"
                  rows={3}
                  data-testid="input-edit-subject-description"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={updateSubjectMutation.isPending}
                data-testid="button-submit-edit-subject"
              >
                {updateSubjectMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
