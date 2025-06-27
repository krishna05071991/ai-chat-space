@@ .. @@
 export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
   return (
-    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl shadow-lg backdrop-blur-sm relative z-40">
+    <div className="bg-red-50/50 border-l-4 border-red-400 p-4 rounded-r-2xl shadow-lg backdrop-blur-sm relative z-40">
       <div className="flex items-center justify-between">
@@ .. @@
         <div className="flex items-center space-x-3">
           <AlertTriangle className="w-5 h-5 text-red-400" />
-          <p className="text-sm text-red-700 font-medium">
+          <p className="body-text text-red-700 font-medium">
             {message}
           </p>
@@ .. @@
         <button
           onClick={onDismiss}
-          className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-xl hover:bg-red-100 flex-shrink-0"
+          className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-2xl hover:bg-red-100/50 flex-shrink-0"
         >
           <X className="w-4 h-4" />