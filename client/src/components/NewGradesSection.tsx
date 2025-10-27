import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Student, Subject, Grade, Class, EducationLevel, User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Save, Plus } from 'lucide-react';
import { useSchoolSettings } from '@/contexts/SchoolSettingsContext';

const ASSESSMENT_TYPES = [
  'مذاكرة',
  'امتحان نهائي',
  'واجب',
  'مشاركة',
  'اختبار قصير',
  'مشروع',
  'نشاط'
] as const;

const SEMESTERS = ['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث'] as const;

export default function NewGradesSection() {
  const { toast } = useToast();
  const { formatDate } = useSchoolSettings();
  
  // Selection states
  const [selectedEducationLevel, setSelectedEducationLevel] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [assessmentType, setAssessmentType] = useState<string>('');
  const [semester, setSemester] = useState<string>('الفصل الأول');
  const [score, setScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('100');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Fetch data
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const { data: educationLevels = [] } = useQuery<EducationLevel[]>({
    queryKey: ['/api/education-levels'],
  });

  // Fetch classes based on user role - teachers get only their assigned classes
  const { data: allClasses = [] } = useQuery<Class[]>({
    queryKey: ['/api/teachers/my-classes'],
  });

  // Fetch subjects for selected class (only after class is selected)
  const { data: classSubjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/teachers/my-subjects', selectedClassId],
    enabled: !!selectedClassId,
  });

  // Fetch students for selected class (only after class is selected)
  const { data: classStudents = [] } = useQuery<Student[]>({
    queryKey: ['/api/teachers/my-students', selectedClassId],
    enabled: !!selectedClassId,
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ['/api/teachers/my-grades'],
  });

  // Filter classes by selected education level
  const filteredClassesByLevel = useMemo(() => {
    if (!selectedEducationLevel) return [];
    return allClasses.filter(c => c.educationLevelId === selectedEducationLevel);
  }, [allClasses, selectedEducationLevel]);

  // Get unique grades from filtered classes
  const availableGrades = useMemo(() => {
    const grades = new Set(filteredClassesByLevel.map(c => c.grade));
    return Array.from(grades).sort();
  }, [filteredClassesByLevel]);

  // Filter classes by selected grade
  const filteredClassesByGrade = useMemo(() => {
    if (!selectedGrade) return [];
    return filteredClassesByLevel.filter(c => c.grade === selectedGrade);
  }, [filteredClassesByLevel, selectedGrade]);

  // Get unique sections from filtered classes
  const availableSections = useMemo(() => {
    const sections = new Set(filteredClassesByGrade.map(c => c.section));
    return Array.from(sections).sort();
  }, [filteredClassesByGrade]);

  // Get the selected class object
  const selectedClass = useMemo(() => {
    if (!selectedGrade || !selectedSection) return null;
    return allClasses.find(c => 
      c.educationLevelId === selectedEducationLevel && 
      c.grade === selectedGrade && 
      c.section === selectedSection
    );
  }, [allClasses, selectedEducationLevel, selectedGrade, selectedSection]);

  // Use students from the API query (already filtered for the selected class)
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return classStudents;
  }, [classStudents, selectedClass]);

  const addGradeMutation = useMutation({
    mutationFn: async (data: {
      studentId: string;
      subjectId: string;
      classId: string;
      semester: string;
      assessmentType: string;
      score: string;
      maxScore: string;
      date: string;
      notes?: string;
    }) => {
      return await apiRequest('POST', '/api/grades', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers/my-grades'] });
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ العلامة بنجاح',
      });
      // Reset form
      setSelectedStudent('');
      setSelectedSubject('');
      setAssessmentType('');
      setScore('');
      setMaxScore('100');
      setNotes('');
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ العلامة',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار الصف والشعبة أولاً',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedStudent || !selectedSubject || !assessmentType || !score) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    const scoreNum = parseFloat(score);
    const maxScoreNum = parseFloat(maxScore);

    if (scoreNum > maxScoreNum) {
      toast({
        title: 'خطأ',
        description: `العلامة التي حصل عليها الطالب (${score}) لا يمكن أن تزيد عن العلامة النهائية (${maxScore})`,
        variant: 'destructive',
      });
      return;
    }

    addGradeMutation.mutate({
      studentId: selectedStudent,
      subjectId: selectedSubject,
      classId: selectedClass.id,
      semester,
      assessmentType,
      score,
      maxScore,
      date,
      notes,
    });
  };

  // Reset dependent fields when selections change
  const handleEducationLevelChange = (value: string) => {
    setSelectedEducationLevel(value);
    setSelectedGrade('');
    setSelectedSection('');
    setSelectedClassId('');
    setSelectedStudent('');
  };

  const handleGradeChange = (value: string) => {
    setSelectedGrade(value);
    setSelectedSection('');
    setSelectedClassId('');
    setSelectedStudent('');
  };

  const handleSectionChange = (value: string) => {
    setSelectedSection(value);
    setSelectedStudent('');
    
    // Find and set the selected class ID when section changes
    const classData = allClasses.find(c => 
      c.educationLevelId === selectedEducationLevel && 
      c.grade === selectedGrade && 
      c.section === value
    );
    if (classData) {
      setSelectedClassId(classData.id);
    }
  };

  const selectedStudentData = classStudents.find((s: Student) => s.id === selectedStudent);
  const studentGrades = grades.filter((g: Grade) => g.studentId === selectedStudent);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            إدخال علامة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Select Education Level, Grade, Section */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-3">
                الخطوة 1: اختر الصف والشعبة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Education Level Selection */}
                <div className="space-y-2">
                  <Label>المرحلة الدراسية *</Label>
                  <Select value={selectedEducationLevel} onValueChange={handleEducationLevelChange}>
                    <SelectTrigger data-testid="select-education-level" className="bg-white dark:bg-white text-gray-900 dark:text-gray-900">
                      <SelectValue placeholder="اختر المرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Grade Selection */}
                <div className="space-y-2">
                  <Label>الصف *</Label>
                  <Select 
                    value={selectedGrade} 
                    onValueChange={handleGradeChange}
                    disabled={!selectedEducationLevel}
                  >
                    <SelectTrigger data-testid="select-grade" className="bg-white dark:bg-white text-gray-900 dark:text-gray-900">
                      <SelectValue placeholder={selectedEducationLevel ? "اختر الصف" : "اختر المرحلة أولاً"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGrades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Section Selection */}
                <div className="space-y-2">
                  <Label>الشعبة *</Label>
                  <Select 
                    value={selectedSection} 
                    onValueChange={handleSectionChange}
                    disabled={!selectedGrade}
                  >
                    <SelectTrigger data-testid="select-section" className="bg-white dark:bg-white text-gray-900 dark:text-gray-900">
                      <SelectValue placeholder={selectedGrade ? "اختر الشعبة" : "اختر الصف أولاً"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSections.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Step 2: Student and Grade Details */}
            {selectedClass && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
                  الخطوة 2: بيانات العلامة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student Selection */}
                  <div className="space-y-2">
                    <Label>اسم الطالب *</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger data-testid="select-student" className="bg-white dark:bg-white text-gray-900 dark:text-gray-900">
                        <SelectValue placeholder={filteredStudents.length > 0 ? "اختر الطالب" : "لا يوجد طلاب في هذه الشعبة"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.arabicName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject Selection */}
                  <div className="space-y-2">
                    <Label>المادة الدراسية *</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger data-testid="select-subject" className="bg-white dark:bg-white text-gray-900 dark:text-gray-900">
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent>
                        {classSubjects.map((subject: Subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.arabicName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assessment Type */}
                  <div className="space-y-2">
                    <Label>نوع الامتحان *</Label>
                    <Select value={assessmentType} onValueChange={setAssessmentType}>
                      <SelectTrigger data-testid="select-assessment-type" className="bg-white dark:bg-white text-gray-900 dark:text-gray-900">
                        <SelectValue placeholder="اختر نوع الامتحان" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSESSMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Semester */}
                  <div className="space-y-2">
                    <Label>الفصل الدراسي</Label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger data-testid="select-semester" className="bg-white dark:bg-white text-gray-900 dark:text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEMESTERS.map((sem) => (
                          <SelectItem key={sem} value={sem}>
                            {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Score */}
                  <div className="space-y-2">
                    <Label>العلامة *</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="أدخل العلامة"
                      data-testid="input-score"
                      className="bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                    />
                  </div>

                  {/* Max Score */}
                  <div className="space-y-2">
                    <Label>العلامة العظمى</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={maxScore}
                      onChange={(e) => setMaxScore(e.target.value)}
                      data-testid="input-max-score"
                      className="bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label>التاريخ</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      data-testid="input-date"
                      className="bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>ملاحظات</Label>
                    <Input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ملاحظات إضافية"
                      data-testid="input-notes"
                      className="bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={addGradeMutation.isPending || !selectedClass}
              data-testid="button-save-grade"
            >
              <Save className="h-4 w-4 ml-2" />
              حفظ العلامة
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Student Grades Summary */}
      {selectedStudentData && studentGrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              علامات الطالب: {selectedStudentData.arabicName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {studentGrades.map((grade: Grade) => {
                const subject = classSubjects.find((s: Subject) => s.id === grade.subjectId);
                return (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                    data-testid={`grade-record-${grade.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{subject?.arabicName}</p>
                      <p className="text-sm text-muted-foreground">
                        {grade.assessmentType} - {grade.semester}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold">
                        {grade.score} / {grade.maxScore}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(grade.date)}
                      </p>
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
