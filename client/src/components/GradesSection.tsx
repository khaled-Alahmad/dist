import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Class, Student, Subject, ClassSubject, Grade } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Save, Search } from 'lucide-react';

export default function GradesSection() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGrades, setEditingGrades] = useState<Record<string, { midterm: number; final: number }>>({});

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: allSubjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
  });

  const { data: gradeSubjects = [] } = useQuery<ClassSubject[]>({
    queryKey: ['/api/class-subjects'],
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ['/api/grades'],
  });

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.classId === selectedClass);
  }, [students, selectedClass]);

  const selectedClassData = useMemo(() => {
    return classes.find(c => c.id === selectedClass);
  }, [classes, selectedClass]);

  const classSubjectsForSelected = useMemo(() => {
    if (!selectedClass || !selectedClassData) return [];
    return gradeSubjects.filter(cs => 
      cs.educationLevelId === selectedClassData.educationLevelId && 
      cs.grade === selectedClassData.grade
    );
  }, [gradeSubjects, selectedClass, selectedClassData]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return classStudents;
    const query = searchQuery.toLowerCase();
    return classStudents.filter(student => 
      student.arabicName.toLowerCase().includes(query) ||
      (student.nationalId && student.nationalId.toLowerCase().includes(query))
    );
  }, [classStudents, searchQuery]);

  const updateGradeMutation = useMutation({
    mutationFn: async (data: { 
      studentId: string; 
      subjectId: string; 
      classId: string;
      midtermGrade: number; 
      finalGrade: number;
      semester: string;
    }) => {
      const midtermGrade = grades.find(g => 
        g.studentId === data.studentId && 
        g.subjectId === data.subjectId && 
        g.classId === data.classId &&
        g.assessmentType === 'midterm'
      );
      
      const finalGrade = grades.find(g => 
        g.studentId === data.studentId && 
        g.subjectId === data.subjectId && 
        g.classId === data.classId &&
        g.assessmentType === 'final'
      );

      const promises = [];

      if (midtermGrade) {
        promises.push(
          apiRequest('PATCH', `/api/grades/${midtermGrade.id}`, {
            score: data.midtermGrade.toString(),
            maxScore: '100',
          })
        );
      } else {
        promises.push(
          apiRequest('POST', '/api/grades', {
            studentId: data.studentId,
            subjectId: data.subjectId,
            classId: data.classId,
            semester: data.semester,
            assessmentType: 'midterm',
            assessmentName: 'مذاكرة نصفية',
            score: data.midtermGrade.toString(),
            maxScore: '100',
            date: new Date().toISOString().split('T')[0],
          })
        );
      }

      if (finalGrade) {
        promises.push(
          apiRequest('PATCH', `/api/grades/${finalGrade.id}`, {
            score: data.finalGrade.toString(),
            maxScore: '100',
          })
        );
      } else {
        promises.push(
          apiRequest('POST', '/api/grades', {
            studentId: data.studentId,
            subjectId: data.subjectId,
            classId: data.classId,
            semester: data.semester,
            assessmentType: 'final',
            assessmentName: 'امتحان نهائي',
            score: data.finalGrade.toString(),
            maxScore: '100',
            date: new Date().toISOString().split('T')[0],
          })
        );
      }

      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grades'] });
      toast({
        title: 'تم حفظ الدرجة',
        description: 'تم حفظ درجة الطالب بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الدرجة',
        variant: 'destructive',
      });
    },
  });

  const getGradesForStudent = (studentId: string, subjectId: string, classId: string) => {
    const midtermGrade = grades.find(g => 
      g.studentId === studentId && 
      g.subjectId === subjectId && 
      g.classId === classId &&
      g.assessmentType === 'midterm'
    );
    
    const finalGrade = grades.find(g => 
      g.studentId === studentId && 
      g.subjectId === subjectId && 
      g.classId === classId &&
      g.assessmentType === 'final'
    );

    return {
      midterm: midtermGrade ? parseFloat(midtermGrade.score) : 0,
      final: finalGrade ? parseFloat(finalGrade.score) : 0,
    };
  };

  const handleGradeChange = (studentId: string, subjectId: string, type: 'midterm' | 'final', value: string) => {
    const key = `${studentId}-${subjectId}`;
    const numValue = parseFloat(value) || 0;
    
    setEditingGrades(prev => ({
      ...prev,
      [key]: {
        midterm: type === 'midterm' ? numValue : (prev[key]?.midterm ?? 0),
        final: type === 'final' ? numValue : (prev[key]?.final ?? 0),
      }
    }));
  };

  const handleSaveGrade = (studentId: string, subjectId: string, classId: string, semester: string) => {
    const key = `${studentId}-${subjectId}`;
    const editedGrade = editingGrades[key];
    
    if (!editedGrade) return;

    updateGradeMutation.mutate({
      studentId,
      subjectId,
      classId,
      midtermGrade: editedGrade.midterm,
      finalGrade: editedGrade.final,
      semester,
    });

    setEditingGrades(prev => {
      const newGrades = { ...prev };
      delete newGrades[key];
      return newGrades;
    });
  };

  const getTotalGrade = (midterm: number, final: number) => {
    return midterm + final;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الدرجات الدراسية</h1>
          <p className="text-muted-foreground mt-1">إدارة درجات الطلاب في المذاكرات النصفية والامتحانات النهائية</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>اختيار الصف</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select value={selectedClass || ''} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-class">
                  <SelectValue placeholder="اختر الصف والشعبة" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClass && (
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث عن طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  data-testid="input-search-student"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClass && classSubjectsForSelected.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">لا توجد مواد دراسية</p>
              <p>يجب إضافة مواد دراسية للصف أولاً من قسم "المراحل الدراسية والصفوف"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClass && classSubjectsForSelected.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {selectedClassData?.name}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary" data-testid="badge-students-count">
                  {filteredStudents.length} طالب
                </Badge>
                <Badge variant="secondary" data-testid="badge-subjects-count">
                  {classSubjectsForSelected.length} مادة
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {classSubjectsForSelected.map((classSubject) => {
                const subject = allSubjects.find(s => s.id === classSubject.subjectId);
                if (!subject) return null;

                return (
                  <div key={classSubject.id} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <h3 className="text-lg font-semibold">{subject.arabicName}</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">الرقم الوطني</TableHead>
                            <TableHead className="text-right">اسم الطالب</TableHead>
                            <TableHead className="text-center">المذاكرة النصفية (100)</TableHead>
                            <TableHead className="text-center">الامتحان النهائي (100)</TableHead>
                            <TableHead className="text-center">المجموع (200)</TableHead>
                            <TableHead className="text-center">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا يوجد طلاب في هذا الصف'}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredStudents.map((student) => {
                              const storedGrades = getGradesForStudent(student.id, classSubject.subjectId, selectedClass);
                              const key = `${student.id}-${classSubject.subjectId}`;
                              const editedGrade = editingGrades[key];
                              const midtermValue = editedGrade?.midterm ?? storedGrades.midterm;
                              const finalValue = editedGrade?.final ?? storedGrades.final;
                              const total = getTotalGrade(midtermValue, finalValue);

                              return (
                                <TableRow key={key} data-testid={`row-student-${student.id}`}>
                                  <TableCell className="font-medium">{student.nationalId || '-'}</TableCell>
                                  <TableCell>{student.arabicName}</TableCell>
                                  <TableCell className="text-center">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.5"
                                      value={(editedGrade?.midterm ?? storedGrades.midterm) || ''}
                                      onChange={(e) => handleGradeChange(student.id, classSubject.subjectId, 'midterm', e.target.value)}
                                      className="w-20 text-center mx-auto"
                                      placeholder="0"
                                      data-testid={`input-midterm-${student.id}-${classSubject.id}`}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.5"
                                      value={(editedGrade?.final ?? storedGrades.final) || ''}
                                      onChange={(e) => handleGradeChange(student.id, classSubject.subjectId, 'final', e.target.value)}
                                      className="w-20 text-center mx-auto"
                                      placeholder="0"
                                      data-testid={`input-final-${student.id}-${classSubject.id}`}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="font-semibold" data-testid={`text-total-${student.id}-${classSubject.id}`}>
                                      {total > 0 ? total.toFixed(1) : '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {editedGrade && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveGrade(student.id, classSubject.subjectId, selectedClass, 'الفصل الأول')}
                                        disabled={updateGradeMutation.isPending}
                                        data-testid={`button-save-${student.id}-${classSubject.id}`}
                                      >
                                        <Save className="h-3 w-3 ml-1" />
                                        حفظ
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
