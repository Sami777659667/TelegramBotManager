const { Telegraf } = require('telegraf');

// === إعدادات المشرف ===
const ADMIN_ID = 123456789; // استبدل هذا بالـ ID الخاص بك
const CHANNEL_ID = -1001234567890; // استبدل هذا بـ ID القناة للإدارة

// === قوالب البوتات (Templates) ===
// هنا يمكنك إضافة منطق مختلف لكل نوع بوت
const botTemplates = {
    // القالب الافتراضي: بوت ردود بسيط
    'echo': (bot) => {
        bot.start((ctx) => ctx.reply('مرحباً! أنا بوت يعمل على Netlify بسرعة فائقة 🚀'));
        bot.on('text', (ctx) => ctx.reply(`قلت: ${ctx.message.text}`));
    },
    
    // قالب متجر: مثال لبوت تطبيق مصغر
    'shop': (bot) => {
        bot.start((ctx) => ctx.reply('مرحباً بك في المتجر المصغر!'));
        bot.command('buy', (ctx) => ctx.reply('اضغط الزر لفتح التطبيق', {
            reply_markup: {
                inline_keyboard: [[{ text: "فتح المتجر", web_app: { url: process.env.URL } }]]
            }
        }));
    }
};

exports.handler = async (event, context) => {
    // 1. التحقق من الطلب
    if (event.httpMethod !== 'POST') {
        return { statusCode: 200, body: 'Bot Server is Running.' };
    }

    try {
        const body = JSON.parse(event.body);
        
        // نستخرج توكن البوت من رابط الويب هوك (يتم تمريره كـ Query Parameter)
        // مثال: https://site.netlify.app/api?token=YOUR_BOT_TOKEN&type=echo
        const { token, type } = event.queryStringParameters;

        if (!token) {
            return { statusCode: 400, body: 'Missing Bot Token' };
        }

        // 2. تهيئة البوت لحظياً (Serverless Style)
        const bot = new Telegraf(token);
        const botType = type || 'echo'; // النوع الافتراضي

        // 3. لوحة تحكم المشرف (Admin Control Middleware)
        bot.use(async (ctx, next) => {
            // تسجيل نشاط البوت في القناة (اختياري للسرعة)
            if (ctx.chat && ctx.chat.id === CHANNEL_ID) {
                // منطق خاص للقناة
            }
            
            // أوامر المشرف فقط
            if (ctx.from && ctx.from.id === ADMIN_ID) {
                if (ctx.message && ctx.message.text === '/stats') {
                    return ctx.reply(`📊 حالة النظام:\nالاستضافة: Netlify\nالقالب: ${botType}`);
                }
            }
            await next();
        });

        // 4. تطبيق القالب المطلوب
        if (botTemplates[botType]) {
            botTemplates[botType](bot);
        } else {
            botTemplates['echo'](bot);
        }

        // 5. معالجة التحديث القادم من تلجرام
        await bot.handleUpdate(body);

        return { statusCode: 200, body: 'OK' };

    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};
