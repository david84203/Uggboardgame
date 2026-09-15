// Han 官方帳號的視覺：米杏底、深棕字、細襯線標題、✦ 裝飾
export const T = {
  page: 'min-h-screen bg-[#F5EFE6] text-[#4A3728]',
  wrap: 'mx-auto w-full max-w-md px-5 pb-28 pt-6',
  h1: 'font-serif text-2xl tracking-wide',
  h2: 'font-serif text-lg tracking-wide',
  sub: 'text-sm text-[#7A6555]',
  card: 'rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-[#E6DACB]',
  btn: 'w-full rounded-full bg-[#4A3728] py-3 text-center text-base font-medium text-[#F5EFE6] active:opacity-80 disabled:opacity-40',
  btnGhost: 'w-full rounded-full border border-[#4A3728] py-3 text-center text-base text-[#4A3728] active:opacity-70',
  chip: 'rounded-full border px-3 py-1.5 text-sm',
  chipOn: 'border-[#4A3728] bg-[#4A3728] text-[#F5EFE6]',
  chipOff: 'border-[#D8C9B6] bg-white text-[#4A3728]',
  bar: 'fixed inset-x-0 bottom-0 mx-auto max-w-md bg-[#F5EFE6]/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur',
}
export const Star = () => <span className="mx-2 text-[#B08968]">✦</span>
