import { useState, useMemo, useCallback } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Dialog } from "@astryxdesign/core/Dialog";
import { DialogHeader } from "@astryxdesign/core/Dialog";
import { Heading, Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { HStack } from "@astryxdesign/core/Layout";
import { Token } from "@astryxdesign/core/Token";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector } from "@astryxdesign/core/Selector";
import { formatJalali } from "../../lib/date";
import { toPersianDigits } from "../../lib/digits";
import {
  DataTable,
  type DataTableColumn,
} from "./DataTable";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "inactive" | "out_of_stock";
  createdAt: string;
};

const categoryOptions = [
  { value: "all", label: "همهٔ دسته‌بندی‌ها" },
  { value: "electronics", label: "الکترونیک" },
  { value: "clothing", label: "پوشاک" },
  { value: "food", label: "مواد غذایی" },
  { value: "home", label: "خانه و آشپزخانه" },
];

const statusOptions = [
  { value: "all", label: "همهٔ وضعیت‌ها" },
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
  { value: "out_of_stock", label: "ناموجود" },
];

const statusLabels: Record<Product["status"], string> = {
  active: "فعال",
  inactive: "غیرفعال",
  out_of_stock: "ناموجود",
};

const statusVariants: Record<Product["status"], "success" | "neutral" | "error"> = {
  active: "success",
  inactive: "neutral",
  out_of_stock: "error",
};

function generateSampleData(): Product[] {
  const categories = ["electronics", "clothing", "food", "home"];
  const productNames = [
    "لپ‌تاپ ایسوس",
    "گوشی سامسونگ",
    "تلویزیون ال‌جی",
    "هدفون سونی",
    "کیبورد مکانیکی",
    "ماوس بی‌سیم",
    "مانیتور دل",
    "پرینتر اچ‌پی",
    "تبلت اپل",
    "دوربین کانن",
    "کولر گازی",
    "ماشین لباسشویی",
    "یخچال فریجیدر",
    "اجاق گاز",
    "جاروبرقی",
    "آبمیوه‌گیری",
    "چایساز",
    "قهوه‌ساز",
    "توستر",
    "مایکروویو",
  ];

  return productNames.map((name, index) => ({
    id: `prod-${String(index + 1)}`,
    name,
    category: categories[index % categories.length],
    price: Math.floor(Math.random() * 50000000) + 1000000,
    stock: Math.floor(Math.random() * 100),
    status: Math.random() > 0.3 ? "active" : Math.random() > 0.5 ? "inactive" : "out_of_stock",
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fa-IR").format(price);
}

function categoryLabel(category: string): string {
  return categoryOptions.find((opt) => opt.value === category)?.label ?? category;
}

export function TablesPage() {
  const [products, setProducts] = useState<Product[]>(() => generateSampleData());
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", stock: "" });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [products, categoryFilter, statusFilter]);

  const handleRowEdit = useCallback(
    (row: Product, columnId: string, value: unknown) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== row.id) return p;
          switch (columnId) {
            case "name":
              return { ...p, name: String(value) };
            case "price":
              return { ...p, price: Number(value) || 0 };
            case "stock":
              return { ...p, stock: Number(value) || 0 };
            default:
              return p;
          }
        }),
      );
    },
    [],
  );

  const handleEditClick = useCallback((product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
    });
    setEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingProduct) return;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== editingProduct.id) return p;
        return {
          ...p,
          name: editForm.name,
          price: Number(editForm.price) || 0,
          stock: Number(editForm.stock) || 0,
        };
      }),
    );
    setEditDialogOpen(false);
    setEditingProduct(null);
  }, [editingProduct, editForm]);

  const columns: DataTableColumn<Product>[] = useMemo(
    () => [
      {
        id: "name",
        header: "نام محصول",
        accessorKey: "name",
        enableEditing: true,
        size: 200,
      },
      {
        id: "category",
        header: "دسته‌بندی",
        accessorKey: "category",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return <Token label={categoryLabel(val)} size="sm" />;
        },
        meta: {
          filterVariant: "select",
          filterOptions: categoryOptions.filter((o) => o.value !== "all"),
        },
      },
      {
        id: "price",
        header: "قیمت (﷼)",
        accessorKey: "price",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return <span dir="ltr">{formatPrice(val)}</span>;
        },
        enableEditing: true,
        size: 150,
      },
      {
        id: "stock",
        header: "موجودی",
        accessorKey: "stock",
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <Text
              type="body"
              size="sm"
              color={val === 0 ? "secondary" : val < 10 ? "accent" : undefined}
            >
              {toPersianDigits(String(val))}
            </Text>
          );
        },
        enableEditing: true,
        size: 100,
      },
      {
        id: "status",
        header: "وضعیت",
        accessorKey: "status",
        cell: ({ getValue }) => {
          const val = getValue() as Product["status"];
          return (
            <HStack gap={1} vAlign="center">
              <StatusDot variant={statusVariants[val]} label={statusLabels[val]} />
              <Text type="body" size="sm">
                {statusLabels[val]}
              </Text>
            </HStack>
          );
        },
        meta: {
          filterVariant: "select",
          filterOptions: statusOptions.filter((o) => o.value !== "all"),
        },
      },
      {
        id: "createdAt",
        header: "تاریخ ایجاد",
        accessorKey: "createdAt",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return formatJalali(val.slice(0, 10));
        },
        size: 120,
      },
      {
        id: "actions",
        header: "اقدامات",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Button
            label="ویرایش"
            variant="secondary"
            size="sm"
            onClick={() => {
              handleEditClick(row.original);
            }}
          />
        ),
        size: 100,
      },
    ],
    [handleEditClick],
  );

  return (
    <VStack gap={4}>
      <HStack hAlign="between" vAlign="end">
        <VStack gap={1}>
          <Heading level={1}>جدول محصولات</Heading>
          <Text type="supporting">
            جست‌وجو، مرتب‌سازی، فیلتر و ویرایش داده‌ها با TanStack Table
          </Text>
        </VStack>
      </HStack>

      <DataTable
        data={filteredProducts}
        columns={columns}
        title="محصولات"
        enableSorting
        enableFiltering
        enableColumnVisibility
        enablePagination
        enableEditing
        globalFilterPlaceholder="جست‌وجو در محصولات..."
        onRowEdit={handleRowEdit}
        toolbarExtra={
          <HStack gap={2} vAlign="end">
            <Selector
              label="دسته‌بندی"
              options={categoryOptions}
              value={categoryFilter}
              onChange={(value) => {
                const selected = categoryOptions.find((o) => o.value === value);
                if (selected) setCategoryFilter(selected.value);
              }}
            />
            <Selector
              label="وضعیت"
              options={statusOptions}
              value={statusFilter}
              onChange={(value) => {
                const selected = statusOptions.find((o) => o.value === value);
                if (selected) setStatusFilter(selected.value);
              }}
            />
          </HStack>
        }
      />

      <Dialog
        isOpen={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
        }}
        purpose="form"
      >
        <DialogHeader title="ویرایش محصول" onOpenChange={(open) => {
          setEditDialogOpen(open);
        }} />
        <VStack gap={4}>
          <TextInput
            label="نام محصول"
            value={editForm.name}
            onChange={(value) => {
              setEditForm((f) => ({ ...f, name: value }));
            }}
          />
          <TextInput
            label="قیمت (﷼)"
            value={editForm.price}
            onChange={(value) => {
              setEditForm((f) => ({ ...f, price: value }));
            }}
          />
          <TextInput
            label="موجودی"
            value={editForm.stock}
            onChange={(value) => {
              setEditForm((f) => ({ ...f, stock: value }));
            }}
          />
          <HStack hAlign="end" gap={2}>
            <Button
              label="لغو"
              variant="secondary"
              onClick={() => {
                setEditDialogOpen(false);
              }}
            />
            <Button label="ذخیره" variant="primary" onClick={handleSaveEdit} />
          </HStack>
        </VStack>
      </Dialog>
    </VStack>
  );
}
