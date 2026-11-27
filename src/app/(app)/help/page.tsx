import { cookies } from 'next/headers';
export default function HelpPage() {
  if (cookies().get('lang')?.value === 'ar') return (<div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-5 bg-white rounded-xl shadow-sm border">
  <h1 className="text-2xl font-bold text-blue-900">📖 دليل الاستخدام</h1>
  <p className="text-gray-500">مرحباً بكم في برنامج إدارة المتجر «متجري».</p>
  <section><h2 className="font-bold text-lg">١. الإعداد الأولي</h2><p>من الإعدادات، أدخل اسم المتجر والعنوان والهاتف ورابط الشعار.</p></section>
  <section><h2 className="font-bold text-lg">٢. إضافة المنتجات</h2><p>من صفحة المنتجات، اختر إضافة منتج وأكمل البيانات، أو استورد ملف Excel.</p></section>
  <section><h2 className="font-bold text-lg">٣. تزويد المخزون</h2><p>من المشتريات، أضف المورد وسجل عملية الشراء لتحديث المخزون.</p></section>
  <section><h2 className="font-bold text-lg">٤. البيع</h2><p>من نقطة البيع، ابحث عن المنتج وأضفه إلى السلة، ثم اختر العميل عند الحاجة وأكد البيع.</p></section>
  <section><h2 className="font-bold text-lg">٥. إدارة الصندوق</h2><p>افتح الصندوق وأدخل الرصيد الأولي، وعند الإغلاق احسب النقد الفعلي لمقارنته بالرصيد المتوقع.</p></section>
  <section><h2 className="font-bold text-lg">٦. العملاء والمستحقات</h2><p>تظهر أرصدة العملاء المستحقة باللون الأحمر. استخدم تذكير واتساب عند توفره.</p></section>
  <section><h2 className="font-bold text-lg">٧. المحاسبة والزكاة</h2><p>يمكن تصدير سجل المبيعات للمحاسب. حساب الزكاة تقديري ويحتاج إلى مراجعة مختص.</p></section>
  <div className="bg-blue-50 p-4 rounded-lg"><h3 className="font-bold">💡 نصيحة</h3><p>احتفظ بنسخ احتياطية منتظمة من بيانات المتجر، وصدّر قائمة المنتجات إذا توفر خيار التصدير.</p></div>
</div>);
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 bg-white rounded-xl shadow-sm border">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-blue-900">📖 Guide d'utilisation</h1>
        <p className="text-gray-500 mt-2">Bienvenue dans votre logiciel de gestion "Mon Magasin".</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800">1️⃣ Configuration Initiale</h2>
        <p className="text-gray-700">Avant de commencer, allez dans <strong>Paramètres</strong> pour renseigner le nom de votre magasin, votre adresse, votre téléphone et le lien de votre logo. Ces informations apparaîtront sur le ticket de caisse.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800">2️⃣ Ajouter des Articles</h2>
        <p className="text-gray-700">Allez dans <strong>Articles</strong> :</p>
        <ul className="list-disc ml-6 text-gray-700 space-y-1">
          <li><strong>Méthode A (Manuel)</strong> : Cliquez sur <em>+ Nouvel article</em> et remplissez le formulaire.</li>
          <li><strong>Méthode B (Excel)</strong> : Cliquez sur <em>Importer Excel</em> pour charger des milliers d'articles d'un coup.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800">3️⃣ Réapprovisionner le Stock (Achats)</h2>
        <p className="text-gray-700">Quand vous recevez de la marchandise, allez dans <strong>Achats</strong>. Ajoutez le fournisseur et enregistrez l'achat. Le stock augmentera automatiquement.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800">4️⃣ Faire une Vente (POS)</h2>
        <p className="text-gray-700">C'est l'écran principal de la caisse. Allez dans <strong>Nouvelle Vente (POS)</strong>, cherchez l'article, ajoutez-le au panier, choisissez le client (optionnel) et cliquez sur <strong>VALIDER LA VENTE</strong>.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800">5️⃣ Gérer la Caisse</h2>
        <p className="text-gray-700">Le matin, allez dans <strong>Caisse</strong> et cliquez sur <strong>Ouvrir la caisse</strong> (mettez votre fond de caisse). Le soir, comptez l'argent et cliquez sur <strong>Clôturer</strong> pour voir s'il y a un écart.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800">6️⃣ Clients et Dettes</h2>
        <p className="text-gray-700">Allez dans <strong>Clients</strong>. Si un client vous doit de l'argent, son solde sera en rouge. Vous pouvez cliquer sur <strong>💬 Rappel WhatsApp</strong> pour lui envoyer un message automatique.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800">7️⃣ Comptabilité et Zakat</h2>
        <p className="text-gray-700">Dans <strong>Comptabilité</strong>, vous pouvez exporter le journal des ventes (HT, TVA, TTC) pour votre comptable. Dans <strong>Zakat</strong>, l'application calcule automatiquement le montant à payer.</p>
      </section>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-8">
        <h3 className="font-bold text-blue-800 mb-1">💡 Astuce importante</h3>
        <p className="text-sm text-blue-700">Pensez à faire un <strong>Export Excel</strong> de vos articles toutes les semaines pour sauvegarder vos données en lieu sûr.</p>
      </div>
    </div>
  );
}