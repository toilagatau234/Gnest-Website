import { Briefcase, Send, Shield, Heart, Award } from 'lucide-react';

import { getJobVacancies, type JobVacancy } from '@/lib/services/job-vacancies';
import { RecruitmentClientActions } from '@/components/RecruitmentClientActions';
import { RecruitmentJobsContainer } from '@/components/RecruitmentJobsContainer';

interface MappedJob {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  salary: string;
  sort_order: number;
}

function mapJob(job: JobVacancy): MappedJob {
  return {
    id: job.id,
    title: job.title,
    slug: job.slug,
    description: job.description || '',
    location: job.location || 'Đồng Tháp',
    salary: job.salary_range || 'Thỏa thuận',
    sort_order: job.sort_order,
  };
}

export default async function TuyenDungPage() {
  let jobs: MappedJob[] = [];
  let loadError: string | null = null;

  try {
    const data = await getJobVacancies();
    jobs = data.map(mapJob);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Không thể tải tin tuyển dụng.';
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-[1220px] mx-auto px-5">
        <div className="relative bg-gradient-to-r from-dtl-navy-dark to-[#1e3a75] text-white rounded-2xl overflow-hidden p-8 md:p-12 mb-10 shadow-md">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M54 48c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3zM6 48c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3z\" fill=\"%23ffffff\" fill-opacity=\"1\" fill-rule=\"evenodd\"/%3E%3C/svg%3E')" }} />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block bg-dtl-red text-white text-[11px] font-bold tracking-widest px-3.5 py-1 rounded-full uppercase mb-4 shadow-[0_2px_8px_rgba(227,30,36,0.3)]">
              Gia nhập đội ngũ Đại Tài Lợi
            </span>
            <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">CƠ HỘI PHÁT TRIỂN SỰ NGHIỆP</h1>
            <p className="text-white/80 text-[14px] md:text-[15px] leading-relaxed mb-6">
              Tại Đại Tài Lợi, chúng tôi tin rằng con người là tài sản quý giá nhất. Chúng tôi luôn chào đón những ứng viên tài năng, nhiệt huyết và khát khao khẳng định mình trong lĩnh vực sản xuất bao bì, chai lọ và dịch vụ kỹ thuật.
            </p>
            <RecruitmentClientActions
              className="bg-dtl-red hover:bg-dtl-red-dark transition-colors px-6 py-3 rounded-lg font-bold text-sm inline-flex items-center gap-2 shadow-lg"
              label="Nộp Hồ Sơ Tự Do"
              icon={<Send className="w-4 h-4" />}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: <Shield className="w-8 h-8 text-dtl-red" />, title: 'Môi Trường Chuyên Nghiệp', desc: 'Hệ thống quy chuẩn vận hành khoa học, trang thiết bị máy móc gia công và sản xuất tối tân hàng đầu.' },
            { icon: <Heart className="w-8 h-8 text-dtl-red" />, title: 'Chế Độ Đãi Ngộ Tốt', desc: 'Mức lương cạnh tranh, chính sách thưởng hiệu suất minh bạch, nghỉ lễ du lịch đầy đủ hàng năm.' },
            { icon: <Award className="w-8 h-8 text-dtl-red" />, title: 'Lộ Trình Thăng Tiến Rõ Ràng', desc: 'Độc lập phát huy sở trường, huấn luyện nâng cao kỹ năng và cơ hội thăng tiến lên các vị trí quản lý.' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-dtl-navy mb-1.5">{item.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {loadError ? (
          <div className="bg-white rounded-xl border border-amber-200 p-8 text-center shadow-sm">
            <Briefcase className="w-12 h-12 text-amber-300 mx-auto mb-3" />
            <h3 className="font-bold text-dtl-navy mb-1.5">Chưa thể tải tin tuyển dụng</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Hệ thống đang tạm thời không lấy được dữ liệu tuyển dụng. Bạn vẫn có thể gửi hồ sơ tự do để đội ngũ Đại Tài Lợi liên hệ lại.
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-dtl-navy mb-1.5">Chưa có vị trí tuyển dụng mới</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Hiện tại Đại Tài Lợi chưa có tin tuyển dụng mới. Bạn có thể nhấn nút &quot;Nộp Hồ Sơ Tự Do&quot; ở trên để gửi thông tin ứng tuyển trực tiếp.
            </p>
          </div>
        ) : (
          <RecruitmentJobsContainer jobs={jobs} />
        )}
      </div>
    </div>
  );
}
