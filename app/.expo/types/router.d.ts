/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

// أنواع المسارات الأساسية
type BaseRoutePaths = 
  | `/edit-profile`
  | `/modal`
  | `/privacy-security`
  | `/ai-analysis`
  | `/../services/aiService`
  | `/_sitemap`;

// أنواع مسارات المصادقة
type AuthRoutes = 
  | `${'/(auth)'}/forgot-password` 
  | `/forgot-password`
  | `${'/(auth)'}/login`
  | `/login`
  | `${'/(auth)'}/register`
  | `/register`;

// أنواع مسارات التبويب
type TabRoutes = 
  | `${'/(tabs)'}/chat`
  | `/chat`
  | `${'/(tabs)'}`
  | `/`
  | `${'/(tabs)'}/profile`
  | `/profile`;

// مسار ديناميكي
type DynamicRoute = `/chat/[id]`;

// جميع المسارات
type AllRoutePaths = BaseRoutePaths | AuthRoutes | TabRoutes | DynamicRoute;

// دالة مساعدة لإضافة query و hash
type WithQueryHash<T> = `${T}${`?${string}` | `#${string}` | ''}`;

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      // أنواع المدخلات
      hrefInputParams: 
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | { pathname: BaseRoutePaths; params?: Router.UnknownInputParams }
        | { pathname: AuthRoutes; params?: Router.UnknownInputParams }
        | { pathname: TabRoutes; params?: Router.UnknownInputParams }
        | { pathname: `/chat/[id]`; params: Router.UnknownInputParams & { id: string | number } };

      // أنواع المخرجات
      hrefOutputParams: 
        | { pathname: Router.RelativePathString; params?: Router.UnknownOutputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownOutputParams }
        | { pathname: BaseRoutePaths; params?: Router.UnknownOutputParams }
        | { pathname: AuthRoutes; params?: Router.UnknownOutputParams }
        | { pathname: TabRoutes; params?: Router.UnknownOutputParams }
        | { pathname: `/chat/[id]`; params: Router.UnknownOutputParams & { id: string } };

      // جميع أنواع الـ href
      href: 
        | Router.RelativePathString
        | Router.ExternalPathString
        | WithQueryHash<BaseRoutePaths>
        | WithQueryHash<AuthRoutes>
        | WithQueryHash<TabRoutes>
        | WithQueryHash<`/chat/${Router.SingleRoutePart<T>}`>
        | { pathname: Router.RelativePathString; params?: Router.UnknownInputParams }
        | { pathname: Router.ExternalPathString; params?: Router.UnknownInputParams }
        | { pathname: BaseRoutePaths; params?: Router.UnknownInputParams }
        | { pathname: AuthRoutes; params?: Router.UnknownInputParams }
        | { pathname: TabRoutes; params?: Router.UnknownInputParams }
        | { pathname: `/chat/[id]`; params: Router.UnknownInputParams & { id: string | number } };
    }
  }
}