import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Teacher, Class, Subject, SectionSubjectTeacher } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TeacherAssignmentsSection() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  // Fetch all data
  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  const { data: assignments = [], isLoading } = useQuery<SectionSubjectTeacher[]>({
    queryKey: ['/api/section-subject-teachers'],
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: { teacherId: string; classId: string; subjectId: string }) => {
      return await apiRequest('POST', '/api/section-subject-teachers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/section-subject-teachers'] });
      toast({
        title: 'تم التعيين',
        description: 'تم تعيين المعلم للمادة بنجاح',
      });
      setIsDialogOpen(false);
      setSelectedTeacher('');
      setSelectedClass('');
      setSelectedSubject('');
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تعيين المعلم',
        variant: 'destructive',
      });
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/section-subject-teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/section-subject-teachers'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف التعيين بنجاح',
      });
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف التعيين',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeacher || !selectedClass || !selectedSubject) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول',
        variant: 'destructive',
      });
      return;
    }

    // Check if assignment already exists
    const existingAssignment = assignments.find(
      a => a.teacherId === selectedTeacher && 
           a.classId === selectedClass && 
           a.subjectId === selectedSubject
    );

    if (existingAssignment) {
      toast({
        title: 'تحذير',
        description: 'هذا التعيين موجود بالفعل',
        variant: 'destructive',
      });
      return;
    }

    createAssignmentMutation.mutate({
      teacherId: selectedTeacher,
      classId: selectedClass,
      subjectId: selectedSubject,
    });
  };

  const handleDelete = (id: string) => {
    setAssignmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (assignmentToDelete) {
      deleteAssignmentMutation.mutate(assignmentToDelete);
    }
  };

  // Helper function to get teacher name
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.arabicName || 'غير معروف';
  };

  // Helper function to get class name
  const getClassName = (classId: string) => {
    const classData = classes.find(c => c.id === classId);
    if (!classData) return 'غير معروف';
    return `${classData.grade} - ${classData.section}`;
  };

  // Helper function to get subject name
  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.arabicName || 'غير معروف';
  };

  // Group assignments by teacher
  const assignmentsByTeacher = teachers.map(teacher => ({
    teacher,
    assignments: assignments.filter(a => a.teacherId === teacher.id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          تعيين المعلمين للمواد
        </h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-assignment">
              <Plus className="h-4 w-4 ml-2" />
              تعيين جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>تعيين معلم لمادة في شعبة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>المعلم *</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger data-testid="select-teacher">
                    <SelectValue placeholder="اختر المعلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.arabicName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>الشعبة *</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger data-testid="select-class">
                    <SelectValue placeholder="اختر الشعبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classData) => (
                      <SelectItem key={classData.id} value={classData.id}>
                        {classData.grade} - {classData.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>المادة *</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger data-testid="select-subject-assignment">
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.arabicName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAssignmentMutation.isPending}
                  data-testid="button-submit-assignment"
                >
                  <UserPlus className="h-4 w-4 ml-2" />
                  تعيين المعلم
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">جاري التحميل...</div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-600 dark:text-gray-400">
              لا توجد تعيينات للمعلمين حالياً
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignmentsByTeacher
            .filter(item => item.assignments.length > 0)
            .map(({ teacher, assignments: teacherAssignments }) => (
              <Card key={teacher.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {teacher.arabicName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {teacherAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 border rounded-md bg-white dark:bg-gray-800"
                        data-testid={`assignment-${assignment.id}`}
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {getSubjectName(assignment.subjectId)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getClassName(assignment.classId)}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(assignment.id)}
                          data-testid={`button-delete-assignment-${assignment.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التعيين؟ لن يتمكن المعلم من الوصول لهذه المادة في هذه الشعبة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
