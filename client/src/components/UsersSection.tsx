import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Student, Teacher, ParentStudent, TeacherUser } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, Shield, Users as UsersIcon, Edit, Key } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

type UserFormData = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
  teacherId?: string;
  guardianName?: string;
  studentIds?: string[];
  relationship?: string;
};

export default function UsersSection() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [guardianSearchQuery, setGuardianSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'parent',
    studentIds: [],
    relationship: 'parent',
  });

  // Always call hooks first (React rules)
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: currentUser?.role === 'admin',
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    enabled: currentUser?.role === 'admin',
  });

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
    enabled: currentUser?.role === 'admin',
  });

  // Check if current user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">غير مصرح</h2>
        <p className="text-gray-600 dark:text-gray-400">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  // Get unique parent names from students
  const parentNames = Array.from(new Set(students.map(s => s.parentName).filter(Boolean)));
  const filteredParentNames = parentNames.filter(name => 
    name.toLowerCase().includes(guardianSearchQuery.toLowerCase())
  );

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const res = await apiRequest('POST', '/api/users', data);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'فشل إنشاء المستخدم');
      }
      const user = await res.json();

      // Link teacher if role is teacher
      if (data.role === 'teacher' && data.teacherId) {
        await apiRequest('POST', '/api/teacher-users', {
          userId: user.id,
          teacherId: data.teacherId,
        });
      }

      // Link students if role is parent
      if (data.role === 'parent' && data.studentIds && data.studentIds.length > 0) {
        await apiRequest('POST', '/api/parent-students', {
          userId: user.id,
          studentIds: data.studentIds,
          relationship: data.relationship || 'parent',
        });
      }

      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: 'تم إنشاء المستخدم',
        description: 'تم إنشاء المستخدم بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<UserFormData> }) => {
      const res = await apiRequest('PATCH', `/api/users/${userId}`, data);
      if (!res.ok) throw new Error('فشل تحديث المستخدم');
      const user = await res.json();

      // Update teacher link if role is teacher
      if (data.role === 'teacher' && data.teacherId) {
        await apiRequest('POST', '/api/teacher-users', {
          userId,
          teacherId: data.teacherId,
        });
      }

      // Update student links if role is parent
      if (data.role === 'parent' && data.studentIds) {
        await apiRequest('POST', '/api/parent-students', {
          userId,
          studentIds: data.studentIds,
          relationship: data.relationship || 'parent',
        });
      }

      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      toast({
        title: 'تم تحديث المستخدم',
        description: 'تم تحديث بيانات المستخدم بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const res = await apiRequest('POST', `/api/users/${userId}/reset-password`, { newPassword });
      if (!res.ok) throw new Error('فشل إعادة تعيين كلمة المرور');
      return await res.json();
    },
    onSuccess: () => {
      setIsResetPasswordDialogOpen(false);
      setEditingUser(null);
      setNewPassword('');
      toast({
        title: 'تم إعادة تعيين كلمة المرور',
        description: 'تم إعادة تعيين كلمة المرور بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'تم حذف المستخدم',
        description: 'تم حذف المستخدم بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'parent',
      studentIds: [],
      relationship: 'parent',
    });
    setGuardianSearchQuery('');
  };

  const handleEdit = async (user: User) => {
    setEditingUser(user);
    
    // Load linked data based on role
    let teacherId = undefined;
    let studentIds: string[] = [];
    let relationship = 'parent';

    if (user.role === 'teacher') {
      const res = await apiRequest('GET', `/api/teacher-users/${user.id}`);
      if (res.ok) {
        const teacherUser: TeacherUser = await res.json();
        if (teacherUser) teacherId = teacherUser.teacherId;
      }
    } else if (user.role === 'parent') {
      const res = await apiRequest('GET', `/api/parent-students/${user.id}`);
      if (res.ok) {
        const parentStudents: ParentStudent[] = await res.json();
        studentIds = parentStudents.map(ps => ps.studentId);
        if (parentStudents.length > 0) relationship = parentStudents[0].relationship;
      }
    }

    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role,
      teacherId,
      guardianName: user.fullName || '',
      studentIds,
      relationship,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const updateData: Partial<UserFormData> = {
      username: formData.username,
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role,
      teacherId: formData.teacherId,
      studentIds: formData.studentIds,
      relationship: formData.relationship,
    };
    
    updateUserMutation.mutate({ userId: editingUser.id, data: updateData });
  };

  const handleResetPassword = () => {
    if (!editingUser || !newPassword) return;
    resetPasswordMutation.mutate({ userId: editingUser.id, newPassword });
  };

  // Auto-fill student IDs when parent name is selected
  useEffect(() => {
    if (formData.role === 'parent' && formData.guardianName) {
      const relatedStudents = students
        .filter(s => s.parentName === formData.guardianName)
        .map(s => s.id);
      setFormData(prev => ({ ...prev, studentIds: relatedStudents }));
    }
  }, [formData.guardianName, formData.role, students]);

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { label: 'إدارة', color: 'bg-red-500' },
      teacher: { label: 'معلم', color: 'bg-blue-500' },
      parent: { label: 'ولي أمر', color: 'bg-green-500' },
    };
    const badge = badges[role as keyof typeof badges] || badges.parent;
    return (
      <span className={`${badge.color} text-white text-xs px-2 py-1 rounded-full`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة المستخدمين</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">إنشاء وإدارة حسابات المستخدمين</p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="flex items-center gap-2"
          data-testid="button-add-user"
        >
          <UserPlus className="w-4 h-4" />
          إنشاء مستخدم جديد
        </Button>
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full">
                  <Shield className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{user.fullName || user.username}</h3>
                    {getRoleBadge(user.role)}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  {user.email && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(user)}
                  className="hover-elevate"
                  data-testid={`button-edit-user-${user.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingUser(user);
                    setNewPassword('');
                    setIsResetPasswordDialogOpen(true);
                  }}
                  className="hover-elevate"
                  data-testid={`button-reset-password-${user.id}`}
                >
                  <Key className="w-4 h-4" />
                </Button>
                {user.id !== currentUser.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                        deleteUserMutation.mutate(user.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    data-testid={`button-delete-user-${user.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء مستخدم جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">الصلاحيات</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'teacher' | 'parent') =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">إدارة - وصول كامل</SelectItem>
                    <SelectItem value="teacher">معلم - إضافة علامات الطلاب</SelectItem>
                    <SelectItem value="parent">ولي أمر - عرض تقارير الأبناء</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Teacher Selection */}
              {formData.role === 'teacher' && (
                <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Label htmlFor="teacherId">المعلم</Label>
                  <Select
                    value={formData.teacherId}
                    onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
                  >
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
              )}

              {/* Parent-Student Linking */}
              {formData.role === 'parent' && (
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">اسم ولي الأمر</Label>
                    <Input
                      id="guardianName"
                      value={guardianSearchQuery}
                      onChange={(e) => setGuardianSearchQuery(e.target.value)}
                      placeholder="ابحث عن اسم ولي الأمر"
                      data-testid="input-guardian-search"
                    />
                    {filteredParentNames.length > 0 && guardianSearchQuery && (
                      <div className="border rounded-md max-h-40 overflow-y-auto">
                        {filteredParentNames.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, guardianName: name });
                              setGuardianSearchQuery(name);
                            }}
                            className="w-full text-right px-3 py-2 hover-elevate"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                    {formData.guardianName && (
                      <p className="text-sm text-green-700 dark:text-green-300">
                        محدد: {formData.guardianName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>الطلاب التابعون</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={formData.studentIds?.includes(student.id)}
                            onCheckedChange={(checked) => {
                              const newStudentIds = checked
                                ? [...(formData.studentIds || []), student.id]
                                : (formData.studentIds || []).filter(id => id !== student.id);
                              setFormData({ ...formData, studentIds: newStudentIds });
                            }}
                            data-testid={`checkbox-student-${student.id}`}
                          />
                          <Label htmlFor={`student-${student.id}`} className="cursor-pointer">
                            {student.arabicName} - {student.parentName}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      محدد: {formData.studentIds?.length || 0} طالب
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relationship">الصلة</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                    >
                      <SelectTrigger data-testid="select-relationship">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">والد/والدة</SelectItem>
                        <SelectItem value="father">أب</SelectItem>
                        <SelectItem value="mother">أم</SelectItem>
                        <SelectItem value="guardian">ولي أمر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  data-testid="input-user-fullname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  data-testid="input-user-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  data-testid="input-user-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-user-email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel-user"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
                data-testid="button-submit-user"
              >
                {createUserMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">الصلاحيات</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'teacher' | 'parent') =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger data-testid="select-edit-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">إدارة - وصول كامل</SelectItem>
                    <SelectItem value="teacher">معلم - إضافة علامات الطلاب</SelectItem>
                    <SelectItem value="parent">ولي أمر - عرض تقارير الأبناء</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Teacher Selection for Edit */}
              {formData.role === 'teacher' && (
                <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Label htmlFor="edit-teacherId">المعلم</Label>
                  <Select
                    value={formData.teacherId}
                    onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
                  >
                    <SelectTrigger data-testid="select-edit-teacher">
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
              )}

              {/* Parent-Student Linking for Edit */}
              {formData.role === 'parent' && (
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="space-y-2">
                    <Label>الطلاب التابعون</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                      {students.map((student) => (
                        <div key={student.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`edit-student-${student.id}`}
                            checked={formData.studentIds?.includes(student.id)}
                            onCheckedChange={(checked) => {
                              const newStudentIds = checked
                                ? [...(formData.studentIds || []), student.id]
                                : (formData.studentIds || []).filter(id => id !== student.id);
                              setFormData({ ...formData, studentIds: newStudentIds });
                            }}
                            data-testid={`checkbox-edit-student-${student.id}`}
                          />
                          <Label htmlFor={`edit-student-${student.id}`} className="cursor-pointer">
                            {student.arabicName} - {student.parentName}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      محدد: {formData.studentIds?.length || 0} طالب
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-relationship">الصلة</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                    >
                      <SelectTrigger data-testid="select-edit-relationship">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">والد/والدة</SelectItem>
                        <SelectItem value="father">أب</SelectItem>
                        <SelectItem value="mother">أم</SelectItem>
                        <SelectItem value="guardian">ولي أمر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-fullName">الاسم الكامل</Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  data-testid="input-edit-user-fullname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-username">اسم المستخدم</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  data-testid="input-edit-user-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">البريد الإلكتروني (اختياري)</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-edit-user-email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
                data-testid="button-submit-edit"
              >
                {updateUserMutation.isPending ? 'جاري التحديث...' : 'تحديث المستخدم'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              إعادة تعيين كلمة المرور للمستخدم: <strong>{editingUser?.fullName || editingUser?.username}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                data-testid="input-new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsResetPasswordDialogOpen(false);
                setNewPassword('');
              }}
              data-testid="button-cancel-reset"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending || !newPassword || newPassword.length < 6}
              data-testid="button-submit-reset"
            >
              {resetPasswordMutation.isPending ? 'جاري الإعادة...' : 'إعادة تعيين'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
