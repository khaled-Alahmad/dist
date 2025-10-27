import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { EducationLevel, Class, Student, Subject, ClassSubject, Teacher } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Plus, Edit, Trash2, GraduationCap, Users, BookOpen, BookMarked } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function ClassesSection() {
  const { toast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [isAddLevelDialogOpen, setIsAddLevelDialogOpen] = useState(false);
  const [isEditLevelDialogOpen, setIsEditLevelDialogOpen] = useState(false);
  const [isAddGradeDialogOpen, setIsAddGradeDialogOpen] = useState(false);
  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false);
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<EducationLevel | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [selectedGradeForSubject, setSelectedGradeForSubject] = useState<{ educationLevelId: string; grade: string } | null>(null);
  
  const [newLevel, setNewLevel] = useState({
    name: '',
    order: 1,
  });

  const [newGrade, setNewGrade] = useState({
    grade: '',
  });

  const [newClass, setNewClass] = useState({
    name: '',
    grade: '',
    section: '',
    academicYear: '2024-2025',
    capacity: 30,
    roomNumber: '',
    educationLevelId: '',
  });

  const [newClassSubject, setNewClassSubject] = useState({
    educationLevelId: '',
    grade: '',
    subjectId: '',
    teacherId: '',
    weeklyHours: 2,
  });

  const { data: levels = [], isLoading: levelsLoading } = useQuery<EducationLevel[]>({
    queryKey: ['/api/education-levels'],
  });

  const { data: allClasses = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: levelClasses = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes/level', selectedLevel?.id],
    enabled: !!selectedLevel,
  });

  const { data: allSubjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
  });

  const { data: gradeSubjects = [] } = useQuery<ClassSubject[]>({
    queryKey: ['/api/grade-subjects', selectedGradeForSubject?.educationLevelId, selectedGradeForSubject?.grade],
    enabled: !!selectedGradeForSubject,
  });

  const createLevelMutation = useMutation({
    mutationFn: async (data: typeof newLevel) => {
      return await apiRequest('POST', '/api/education-levels', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education-levels'] });
      setIsAddLevelDialogOpen(false);
      setNewLevel({ name: '', order: 1 });
    },
  });

  const updateLevelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EducationLevel> }) => {
      return await apiRequest('PATCH', `/api/education-levels/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education-levels'] });
      setIsEditLevelDialogOpen(false);
      setEditingLevel(null);
    },
  });

  const deleteLevelMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/education-levels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education-levels'] });
      if (selectedLevel?.id === deleteLevelMutation.variables) {
        setSelectedLevel(null);
        setSelectedGrade(null);
      }
    },
  });

  const createGradeMutation = useMutation({
    mutationFn: async (data: { grade: string; educationLevelId: string }) => {
      const gradeData = {
        name: `الصف ${data.grade} - شعبة أ`,
        grade: data.grade,
        section: 'أ',
        academicYear: '2024-2025',
        capacity: 30,
        roomNumber: '',
        educationLevelId: data.educationLevelId,
      };
      return await apiRequest('POST', '/api/classes', gradeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/level', selectedLevel?.id] });
      setIsAddGradeDialogOpen(false);
      setNewGrade({ grade: '' });
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: typeof newClass) => {
      return await apiRequest('POST', '/api/classes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/level', selectedLevel?.id] });
      setIsAddClassDialogOpen(false);
      setNewClass({
        name: '',
        grade: '',
        section: '',
        academicYear: '2024-2025',
        capacity: 30,
        roomNumber: '',
        educationLevelId: '',
      });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Class> }) => {
      return await apiRequest('PATCH', `/api/classes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/level', selectedLevel?.id] });
      setIsEditClassDialogOpen(false);
      setEditingClass(null);
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/level', selectedLevel?.id] });
    },
  });

  const createClassSubjectMutation = useMutation({
    mutationFn: async (data: typeof newClassSubject) => {
      return await apiRequest('POST', '/api/class-subjects', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/grade-subjects', variables.educationLevelId, variables.grade] });
      setIsAddSubjectDialogOpen(false);
      setNewClassSubject({
        educationLevelId: '',
        grade: '',
        subjectId: '',
        teacherId: '',
        weeklyHours: 2,
      });
      toast({
        title: 'تم إضافة المادة',
        description: 'تم إضافة المادة الدراسية للصف بنجاح',
      });
    },
  });

  const deleteClassSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/class-subjects/${id}`);
    },
    onSuccess: () => {
      if (selectedGradeForSubject) {
        queryClient.invalidateQueries({ queryKey: ['/api/grade-subjects', selectedGradeForSubject.educationLevelId, selectedGradeForSubject.grade] });
      }
      toast({
        title: 'تم حذف المادة',
        description: 'تم حذف المادة الدراسية من الصف بنجاح',
      });
    },
  });

  const handleLevelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLevelMutation.mutate(newLevel);
  };

  const handleEditLevelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLevel) {
      updateLevelMutation.mutate({ id: editingLevel.id, data: editingLevel });
    }
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLevel) {
      createGradeMutation.mutate({
        grade: newGrade.grade,
        educationLevelId: selectedLevel.id,
      });
    }
  };

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const classData = {
      ...newClass,
      name: `الصف ${newClass.grade} - شعبة ${newClass.section}`,
    };
    createClassMutation.mutate(classData);
  };

  const handleEditClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      const updatedData = {
        ...editingClass,
        name: `الصف ${editingClass.grade} - شعبة ${editingClass.section}`,
      };
      updateClassMutation.mutate({ id: editingClass.id, data: updatedData });
    }
  };

  const openEditLevelDialog = (level: EducationLevel) => {
    setEditingLevel(level);
    setIsEditLevelDialogOpen(true);
  };

  const openEditClassDialog = (classItem: Class) => {
    setEditingClass(classItem);
    setIsEditClassDialogOpen(true);
  };

  const openAddClassDialog = (level: EducationLevel, grade?: string) => {
    setNewClass({ 
      ...newClass, 
      educationLevelId: level.id,
      grade: grade || ''
    });
    setIsAddClassDialogOpen(true);
  };

  const openAddSubjectDialog = (educationLevelId: string, grade: string) => {
    setSelectedGradeForSubject({ educationLevelId, grade });
    setNewClassSubject({
      ...newClassSubject,
      educationLevelId,
      grade,
    });
    setIsAddSubjectDialogOpen(true);
  };

  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { teacherId, ...rest } = newClassSubject;
    const subjectData = {
      ...rest,
      ...(teacherId && teacherId !== 'none' ? { teacherId } : {}),
    };
    createClassSubjectMutation.mutate(subjectData as any);
  };

  const handleDeleteLevel = (levelId: string) => {
    const levelClasses = getClassesForLevel(levelId);
    if (levelClasses.length > 0) {
      toast({
        title: 'لا يمكن الحذف',
        description: `لا يمكن حذف المرحلة لأنها تحتوي على ${levelClasses.length} صف. يرجى حذف الصفوف أولاً.`,
        variant: 'destructive',
      });
      return;
    }
    deleteLevelMutation.mutate(levelId);
  };

  const getClassesForLevel = (levelId: string) => {
    return allClasses.filter(c => c.educationLevelId === levelId);
  };

  const getGradesForLevel = (levelId: string) => {
    const classes = getClassesForLevel(levelId);
    const grades = new Set(classes.map(c => c.grade));
    return Array.from(grades).sort();
  };

  const getSectionsForGrade = (levelId: string, grade: string) => {
    return allClasses.filter(c => c.educationLevelId === levelId && c.grade === grade);
  };

  const getStudentsForClass = (classId: string) => {
    return students.filter(s => s.classId === classId);
  };

  const getSubjectsForGrade = (educationLevelId: string, grade: string) => {
    return gradeSubjects.filter(cs => cs.educationLevelId === educationLevelId && cs.grade === grade);
  };

  const totalClasses = allClasses.length;
  const totalStudents = students.length;
  const totalCapacity = allClasses.reduce((sum, c) => sum + (c.capacity || 0), 0);

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">المراحل الدراسية والصفوف</h1>
        <p className="text-gray-600 dark:text-gray-400">إدارة المراحل الدراسية والصفوف والشعب</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-bold mb-2">المراحل الدراسية</p>
                <p className="text-3xl font-bold text-primary">{levels.length}</p>
              </div>
              <div className="text-4xl">🏛️</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-bold mb-2">إجمالي الصفوف</p>
                <p className="text-3xl font-bold text-primary">{totalClasses}</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-bold mb-2">إجمالي الطلاب</p>
                <p className="text-3xl font-bold text-primary">{totalStudents}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-bold mb-2">السعة الإجمالية</p>
                <p className="text-3xl font-bold text-primary">{totalCapacity}</p>
              </div>
              <div className="text-4xl">🏫</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!selectedLevel ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🏛️</span>
              المراحل الدراسية
            </CardTitle>
            <Dialog open={isAddLevelDialogOpen} onOpenChange={setIsAddLevelDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-level">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مرحلة دراسية
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة مرحلة دراسية جديدة</DialogTitle>
                  <DialogDescription>أدخل بيانات المرحلة الدراسية الجديدة</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLevelSubmit} className="space-y-4">
                  <div>
                    <Label>اسم المرحلة</Label>
                    <Input
                      value={newLevel.name}
                      onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                      placeholder="مثال: المرحلة الابتدائية"
                      required
                      data-testid="input-level-name"
                    />
                  </div>
                  <div>
                    <Label>الترتيب</Label>
                    <Input
                      type="number"
                      value={newLevel.order}
                      onChange={(e) => setNewLevel({ ...newLevel, order: parseInt(e.target.value) })}
                      min="1"
                      required
                      data-testid="input-level-order"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createLevelMutation.isPending} data-testid="button-submit-level">
                    {createLevelMutation.isPending ? 'جاري الإضافة...' : 'إضافة المرحلة'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {levelsLoading ? (
              <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
            ) : levels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد مراحل دراسية</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {levels.map((level) => {
                  const levelClasses = getClassesForLevel(level.id);
                  const levelStudents = levelClasses.reduce(
                    (sum, c) => sum + getStudentsForClass(c.id).length,
                    0
                  );
                  return (
                    <Card 
                      key={level.id} 
                      className="hover-elevate active-elevate-2 cursor-pointer"
                      onClick={() => {
                        setSelectedLevel(level);
                        setSelectedGrade(null);
                      }}
                      data-testid={`card-level-${level.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{level.name}</CardTitle>
                          </div>
                          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{levelClasses.length} صف</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{levelStudents} طالب</span>
                          </div>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditLevelDialog(level)}
                            data-testid={`button-edit-level-${level.id}`}
                          >
                            <Edit className="h-3 w-3 ml-1" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteLevel(level.id)}
                            disabled={deleteLevelMutation.isPending}
                            data-testid={`button-delete-level-${level.id}`}
                          >
                            <Trash2 className="h-3 w-3 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : !selectedGrade ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedLevel(null);
                  setSelectedGrade(null);
                }}
                data-testid="button-back-to-levels"
              >
                <ChevronLeft className="h-4 w-4 rotate-180 ml-1" />
                رجوع للمراحل
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {selectedLevel.name} - الصفوف الدراسية
                </CardTitle>
              </div>
            </div>
            <Button onClick={() => setIsAddGradeDialogOpen(true)} data-testid="button-add-grade">
              <Plus className="h-4 w-4 ml-2" />
              إضافة صف
            </Button>
          </CardHeader>
          <CardContent>
            {getGradesForLevel(selectedLevel.id).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد صفوف في هذه المرحلة</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getGradesForLevel(selectedLevel.id).map((grade) => {
                  const gradeSections = getSectionsForGrade(selectedLevel.id, grade);
                  const gradeStudents = gradeSections.reduce(
                    (sum, section) => sum + getStudentsForClass(section.id).length,
                    0
                  );
                  return (
                    <Card 
                      key={grade} 
                      className="hover-elevate active-elevate-2 cursor-pointer"
                      onClick={() => setSelectedGrade(grade)}
                      data-testid={`card-grade-${grade}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg">الصف {grade}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {gradeSections.length} شعبة
                            </p>
                          </div>
                          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{gradeStudents} طالب</span>
                          </div>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full"
                            onClick={() => openAddSubjectDialog(selectedLevel.id, grade)}
                            data-testid={`button-manage-subjects-${grade}`}
                          >
                            <BookMarked className="h-3 w-3 ml-1" />
                            إدارة المواد ({getSubjectsForGrade(selectedLevel.id, grade).length})
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedGrade(null)}
                data-testid="button-back-to-grades"
              >
                <ChevronLeft className="h-4 w-4 rotate-180 ml-1" />
                رجوع للصفوف
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {selectedLevel.name} - الصف {selectedGrade}
                </CardTitle>
              </div>
            </div>
            <Button onClick={() => openAddClassDialog(selectedLevel, selectedGrade)} data-testid="button-add-section">
              <Plus className="h-4 w-4 ml-2" />
              إضافة شعبة
            </Button>
          </CardHeader>
          <CardContent>
            {getSectionsForGrade(selectedLevel.id, selectedGrade).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">لا توجد شعب في هذا الصف</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getSectionsForGrade(selectedLevel.id, selectedGrade).map((section) => {
                  const sectionStudents = getStudentsForClass(section.id);
                  return (
                    <Card key={section.id} data-testid={`card-section-${section.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-base">الشعبة {section.section}</CardTitle>
                          </div>
                          <Badge variant="secondary">
                            {sectionStudents.length}/{section.capacity}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          <div className="text-xs text-muted-foreground">
                            {section.roomNumber ? `قاعة ${section.roomNumber}` : 'بدون قاعة'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            العام الدراسي: {section.academicYear}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditClassDialog(section)}
                            data-testid={`button-edit-section-${section.id}`}
                          >
                            <Edit className="h-3 w-3 ml-1" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteClassMutation.mutate(section.id)}
                            disabled={deleteClassMutation.isPending}
                            data-testid={`button-delete-section-${section.id}`}
                          >
                            <Trash2 className="h-3 w-3 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Level Dialog */}
      <Dialog open={isEditLevelDialogOpen} onOpenChange={setIsEditLevelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المرحلة الدراسية</DialogTitle>
            <DialogDescription>قم بتعديل بيانات المرحلة الدراسية</DialogDescription>
          </DialogHeader>
          {editingLevel && (
            <form onSubmit={handleEditLevelSubmit} className="space-y-4">
              <div>
                <Label>اسم المرحلة</Label>
                <Input
                  value={editingLevel.name}
                  onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                  required
                  data-testid="input-edit-level-name"
                />
              </div>
              <div>
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  value={editingLevel.order}
                  onChange={(e) => setEditingLevel({ ...editingLevel, order: parseInt(e.target.value) })}
                  min="1"
                  required
                  data-testid="input-edit-level-order"
                />
              </div>
              <Button type="submit" className="w-full" disabled={updateLevelMutation.isPending} data-testid="button-submit-edit-level">
                {updateLevelMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Grade Dialog */}
      <Dialog open={isAddGradeDialogOpen} onOpenChange={setIsAddGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة صف دراسي جديد</DialogTitle>
            <DialogDescription>أدخل اسم الصف الدراسي الجديد (سيتم إنشاء شعبة أ تلقائياً)</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div>
              <Label>اسم الصف الدراسي</Label>
              <Input
                value={newGrade.grade}
                onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value })}
                placeholder="مثال: الأول، الثاني، العاشر"
                required
                data-testid="input-grade-name"
              />
            </div>
            <Button type="submit" className="w-full" disabled={createGradeMutation.isPending} data-testid="button-submit-grade">
              {createGradeMutation.isPending ? 'جاري الإضافة...' : 'إضافة الصف'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Class Dialog */}
      <Dialog open={isAddClassDialogOpen} onOpenChange={setIsAddClassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة شعبة جديدة</DialogTitle>
            <DialogDescription>أدخل بيانات الشعبة الجديدة</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleClassSubmit} className="space-y-4">
            <div>
              <Label>الشعبة</Label>
              <Input
                value={newClass.section}
                onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                placeholder="مثال: أ، ب، ج"
                required
                data-testid="input-class-section"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>العام الدراسي</Label>
                <Input
                  value={newClass.academicYear}
                  onChange={(e) => setNewClass({ ...newClass, academicYear: e.target.value })}
                  required
                  data-testid="input-academic-year"
                />
              </div>
              <div>
                <Label>رقم القاعة</Label>
                <Input
                  value={newClass.roomNumber}
                  onChange={(e) => setNewClass({ ...newClass, roomNumber: e.target.value })}
                  placeholder="اختياري"
                  data-testid="input-room-number"
                />
              </div>
            </div>
            <div>
              <Label>السعة</Label>
              <Input
                type="number"
                value={newClass.capacity}
                onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) })}
                required
                data-testid="input-capacity"
              />
            </div>
            <Button type="submit" className="w-full" disabled={createClassMutation.isPending} data-testid="button-submit-class">
              {createClassMutation.isPending ? 'جاري الإضافة...' : 'إضافة الشعبة'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={isEditClassDialogOpen} onOpenChange={setIsEditClassDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الشعبة</DialogTitle>
            <DialogDescription>قم بتعديل بيانات الشعبة</DialogDescription>
          </DialogHeader>
          {editingClass && (
            <form onSubmit={handleEditClassSubmit} className="space-y-4">
              <div>
                <Label>الشعبة</Label>
                <Input
                  value={editingClass.section || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, section: e.target.value })}
                  required
                  data-testid="input-edit-class-section"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>العام الدراسي</Label>
                  <Input
                    value={editingClass.academicYear || ''}
                    onChange={(e) => setEditingClass({ ...editingClass, academicYear: e.target.value })}
                    required
                    data-testid="input-edit-academic-year"
                  />
                </div>
                <div>
                  <Label>رقم القاعة</Label>
                  <Input
                    value={editingClass.roomNumber || ''}
                    onChange={(e) => setEditingClass({ ...editingClass, roomNumber: e.target.value })}
                    data-testid="input-edit-room-number"
                  />
                </div>
              </div>
              <div>
                <Label>السعة</Label>
                <Input
                  type="number"
                  value={editingClass.capacity || 30}
                  onChange={(e) => setEditingClass({ ...editingClass, capacity: parseInt(e.target.value) })}
                  required
                  data-testid="input-edit-capacity"
                />
              </div>
              <Button type="submit" className="w-full" disabled={updateClassMutation.isPending} data-testid="button-submit-edit-class">
                {updateClassMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Subjects Dialog */}
      <Dialog open={isAddSubjectDialogOpen} onOpenChange={setIsAddSubjectDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="h-5 w-5" />
              إدارة المواد الدراسية
            </DialogTitle>
            <DialogDescription>
              {selectedGradeForSubject && selectedLevel && `${selectedLevel.name} - الصف ${selectedGradeForSubject.grade}`}
            </DialogDescription>
          </DialogHeader>

          {selectedGradeForSubject && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">المواد الحالية</h3>
                {getSubjectsForGrade(selectedGradeForSubject.educationLevelId, selectedGradeForSubject.grade).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                    لا توجد مواد دراسية مضافة لهذا الصف
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getSubjectsForGrade(selectedGradeForSubject.educationLevelId, selectedGradeForSubject.grade).map((classSubject) => {
                      const subject = allSubjects.find(s => s.id === classSubject.subjectId);
                      const teacher = teachers.find(t => t.id === classSubject.teacherId);
                      return (
                        <Card key={classSubject.id} data-testid={`card-subject-${classSubject.id}`}>
                          <CardContent className="py-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-semibold">{subject?.name || 'مادة غير معروفة'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {teacher ? `المعلم: ${teacher.arabicName}` : 'بدون معلم'} • {classSubject.weeklyHours} ساعات أسبوعياً
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteClassSubjectMutation.mutate(classSubject.id)}
                                disabled={deleteClassSubjectMutation.isPending}
                                data-testid={`button-delete-subject-${classSubject.id}`}
                              >
                                <Trash2 className="h-3 w-3 ml-1" />
                                حذف
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">إضافة مادة جديدة</h3>
                <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
                  <div>
                    <Label>المادة الدراسية</Label>
                    <Select
                      value={newClassSubject.subjectId}
                      onValueChange={(value) => setNewClassSubject({ ...newClassSubject, subjectId: value })}
                      required
                    >
                      <SelectTrigger data-testid="select-subject">
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent>
                        {allSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>المعلم (اختياري)</Label>
                    <Select
                      value={newClassSubject.teacherId}
                      onValueChange={(value) => setNewClassSubject({ ...newClassSubject, teacherId: value })}
                    >
                      <SelectTrigger data-testid="select-teacher">
                        <SelectValue placeholder="اختر المعلم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون معلم</SelectItem>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.arabicName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>عدد الساعات الأسبوعية</Label>
                    <Input
                      type="number"
                      value={newClassSubject.weeklyHours}
                      onChange={(e) => setNewClassSubject({ ...newClassSubject, weeklyHours: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                      required
                      data-testid="input-weekly-hours"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createClassSubjectMutation.isPending || !newClassSubject.subjectId}
                    data-testid="button-submit-subject"
                  >
                    {createClassSubjectMutation.isPending ? 'جاري الإضافة...' : 'إضافة المادة'}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
