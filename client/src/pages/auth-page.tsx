import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Redirect } from "wouter";
import { GraduationCap } from "lucide-react";
import type { SchoolSettings } from "@shared/schema";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });

  // جلب إعدادات المدرسة
  const { data: schoolSettings } = useQuery<SchoolSettings>({
    queryKey: ['/api/school-settings'],
    retry: false,
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden md:flex flex-col items-center justify-center text-center space-y-6 p-8">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <GraduationCap className="w-20 h-20 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {schoolSettings?.schoolNameArabic || 'مدرسة النور الأهلية'}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              نظام إدارة مدرسي متكامل
            </p>
          </div>
          <div className="space-y-2 text-gray-600 dark:text-gray-400">
            <p>✨ إدارة الطلاب والمعلمين</p>
            <p>📊 متابعة الدرجات والحضور</p>
            <p>💰 إدارة المحاسبة والرسوم</p>
            <p>📱 إشعارات فورية للأهالي</p>
          </div>
        </div>

        {/* Login Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>تسجيل الدخول</CardTitle>
              <CardDescription>أدخل بياناتك للوصول إلى لوحة التحكم</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">اسم المستخدم</Label>
                  <Input
                    id="login-username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required
                    data-testid="input-login-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">كلمة المرور</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    data-testid="input-login-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
