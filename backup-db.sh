#!/bin/bash

# ==============================================
# Database Backup Script
# سكريبت النسخ الاحتياطي لقاعدة البيانات
# ==============================================

# إعدادات
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="school_management"

# إنشاء مجلد النسخ الاحتياطي إذا لم يكن موجوداً
mkdir -p $BACKUP_DIR

echo "================================================"
echo "🗄️ بدء النسخ الاحتياطي لقاعدة البيانات..."
echo "================================================"
echo "📊 قاعدة البيانات: $DB_NAME"
echo "📁 المجلد: $BACKUP_DIR"
echo "⏰ التاريخ والوقت: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# نسخ احتياطي مضغوط
echo "💾 جاري إنشاء النسخة الاحتياطية..."
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/school_db_$DATE.sql.gz

# التحقق من نجاح النسخ
if [ $? -eq 0 ]; then
    FILE_SIZE=$(du -h "$BACKUP_DIR/school_db_$DATE.sql.gz" | cut -f1)
    echo "✅ تم إنشاء النسخة الاحتياطية بنجاح!"
    echo "📦 اسم الملف: school_db_$DATE.sql.gz"
    echo "📏 الحجم: $FILE_SIZE"
else
    echo "❌ فشل إنشاء النسخة الاحتياطية!"
    exit 1
fi

# حذف النسخ القديمة (أكثر من 7 أيام)
echo ""
echo "🧹 جاري حذف النسخ الاحتياطية القديمة (أكثر من 7 أيام)..."
DELETED=$(find $BACKUP_DIR -name "school_db_*.sql.gz" -mtime +7 -delete -print | wc -l)
echo "🗑️ تم حذف $DELETED نسخة احتياطية قديمة"

# عرض جميع النسخ الاحتياطية الحالية
echo ""
echo "📋 النسخ الاحتياطية المتوفرة:"
ls -lh $BACKUP_DIR/school_db_*.sql.gz 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}'

echo ""
echo "================================================"
echo "✅ اكتمل النسخ الاحتياطي بنجاح!"
echo "================================================"
echo ""
echo "📌 ملاحظات:"
echo "  - لاستعادة النسخة: gunzip -c $BACKUP_DIR/school_db_$DATE.sql.gz | sudo -u postgres psql $DB_NAME"
echo "  - مجلد النسخ الاحتياطي: $BACKUP_DIR"
echo ""
