const ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "fridge", label: "Lodówka" },
  { key: "generate", label: "Generowanie" },
  { key: "saved", label: "Zapisane" },
  { key: "shopping", label: "Lista zakupów" },
  { key: "account", label: "Konto" }
];

export default function TabNav({ tab, onChange }) {
  return (
    <div className="tabnav">
      {ITEMS.map((item) => (
        <button
          key={item.key}
          className={tab === item.key ? "tab active" : "tab"}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}