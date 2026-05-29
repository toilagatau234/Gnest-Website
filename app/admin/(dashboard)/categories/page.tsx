import { AlertCircle } from 'lucide-react';

export default function CategoriesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Danh mục</h1>
        <p className="text-gray-600 mt-2">Manage product and service categories</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-100 rounded-full p-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <p className="text-gray-600 text-lg font-medium">Coming Soon</p>
        <p className="text-sm text-gray-500 mt-2">
          Category management features are under development
        </p>
      </div>
    </div>
  );
}
