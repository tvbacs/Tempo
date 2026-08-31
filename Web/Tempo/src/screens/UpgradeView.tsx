import React from 'react';
import { Sparkles, Check, Crown, Zap, ShieldCheck } from 'lucide-react';

export const UpgradeView: React.FC = () => {
  const plans = [
    {
      id: 'free',
      name: 'Gói Miễn Phí',
      price: '0đ',
      period: 'mãi mãi',
      features: [
        'Nghe nhạc trực tuyến 128kbps',
        'Tải nhạc cơ bản 128kbps',
        'Quảng cáo định kỳ',
      ],
      isPopular: false,
      buttonText: 'Gói hiện tại',
      buttonDisabled: true,
    },
    {
      id: 'vip',
      name: 'Tempo Premium VIP',
      price: '49.000đ',
      period: 'tháng',
      features: [
        'Tải nhạc lossless & 320kbps không giới hạn',
        'Âm thanh vòm chất lượng phòng thu',
        'Hoàn toàn không quảng cáo',
        'Đồng bộ đa thiết bị không gián đoạn',
        'Nghe nhạc ngoại tuyến mọi lúc mọi nơi',
      ],
      isPopular: true,
      buttonText: 'Nâng cấp ngay',
      buttonDisabled: false,
    },
    {
      id: 'family',
      name: 'Gói Gia Đình',
      price: '89.000đ',
      period: 'tháng',
      features: [
        'Tất cả quyền lợi của Premium VIP',
        'Tối đa 6 tài khoản thành viên',
        'Danh sách phát gia đình thông minh',
        'Kiểm soát nội dung cho trẻ em',
      ],
      isPopular: false,
      buttonText: 'Đăng ký Family',
      buttonDisabled: false,
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar select-none">
      {/* Header Banner */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#FC475C] text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TEMPO PREMIUM</span>
        </div>
        <h1 className="text-3xl font-black text-white mb-3">
          Trải nghiệm âm nhạc đỉnh cao không giới hạn
        </h1>
        <p className="text-sm text-text-secondary">
          Tải nhạc 320kbps, không quảng cáo, mở khóa chất lượng âm thanh phòng thu đỉnh cao.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mb-10">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl p-6 flex flex-col justify-between relative transition-all border-none ${
              plan.isPopular
                ? 'bg-[#1C1C24] ring-2 ring-[#FC475C] shadow-2xl shadow-primary/20'
                : 'bg-[#16161D]'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FC475C] to-[#FC655A] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                Phổ biến nhất
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-white">{plan.name}</h3>
                {plan.isPopular && <Crown className="w-5 h-5 text-[#FC475C]" />}
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-2xl font-black text-white">{plan.price}</span>
                <span className="text-xs text-text-muted">/{plan.period}</span>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#FC475C] flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-text-secondary leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              disabled={plan.buttonDisabled}
              className={`w-full py-3 rounded-xl text-xs font-black transition-all border-none ${
                plan.isPopular
                  ? 'bg-gradient-to-r from-[#FC475C] to-[#FC655A] text-white hover:opacity-90 active:scale-98 shadow-lg shadow-primary/25 cursor-pointer'
                  : plan.buttonDisabled
                  ? 'bg-white/5 text-text-muted cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-white/15 active:scale-98 cursor-pointer'
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
