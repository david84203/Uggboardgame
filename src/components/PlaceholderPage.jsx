export default function PlaceholderPage({ title, icon = '🚧' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] px-6 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-xl font-bold text-stone-700 mb-2">{title}</h2>
      <p className="text-stone-400 text-sm">內容建置中，敬請期待</p>
    </div>
  );
}
