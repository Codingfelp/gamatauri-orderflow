import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
}

interface OrderData {
  id: string;
  external_order_number: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  payment_method: string;
  payment_timing: string;
  total_amount: number;
  delivery_type: string | null;
  notes: string | null;
  change_for: string | null;
  discount_amount: number | null;
  created_at: string;
  items: Array<{
    product_name: string;
    quantity: number;
    product_price: number;
    subtotal: number;
  }>;
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    pix: "PIX",
    dinheiro: "Dinheiro",
    cartao: "Cartão",
    card: "Cartão",
    credit: "Crédito",
    debit: "Débito",
  };
  return map[method?.toLowerCase()] || method || "Não informado";
}

function generateReceiptHTML(data: OrderData, orderNumber: string): string {
  const date = new Date(data.created_at).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subtotal = data.items.reduce((s, i) => s + i.subtotal, 0);
  const deliveryFee = data.total_amount - subtotal + (data.discount_amount || 0);
  const discount = data.discount_amount || 0;

  let itemsHTML = "";
  for (const item of data.items) {
    itemsHTML += `
      <tr>
        <td style="padding:6px 0;font-size:13px;border-bottom:1px solid #eee;">${item.quantity}x</td>
        <td style="padding:6px 4px;font-size:13px;border-bottom:1px solid #eee;">${item.product_name}</td>
        <td style="padding:6px 0;font-size:13px;text-align:right;border-bottom:1px solid #eee;">R$ ${item.product_price.toFixed(2).replace(".", ",")}</td>
        <td style="padding:6px 0;font-size:13px;text-align:right;border-bottom:1px solid #eee;font-weight:600;">R$ ${item.subtotal.toFixed(2).replace(".", ",")}</td>
      </tr>`;
  }

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Comprovante #${orderNumber}</title>
<style>
  @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; } }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Sul Sans', Arial, sans-serif; font-size:14px; line-height:1.5; width:320px; margin:0 auto; padding:20px; color:#000; background:#fff; }
  .center { text-align:center; }
  .brand { font-size:22px; letter-spacing:0.15em; font-weight:700; }
  .subtitle { font-size:11px; margin-top:2px; color:#555; }
  .divider { border-top:2px dashed #000; margin:14px 0; }
  .divider-light { border-top:1px dashed #aaa; margin:10px 0; }
  .info-row { display:flex; justify-content:space-between; margin:5px 0; font-size:13px; }
  .info-label { color:#555; }
  .info-value { font-weight:600; }
  .section-label { font-size:10px; text-transform:uppercase; color:#777; font-weight:600; letter-spacing:0.05em; margin-bottom:2px; }
  .total-row { display:flex; justify-content:space-between; font-size:18px; font-weight:800; margin:12px 0; padding:8px 0; }
  .summary-row { display:flex; justify-content:space-between; margin:5px 0; font-size:13px; }
  .summary-row.discount { color:#c00; }
  .footer-msg { font-size:10px; color:#888; text-transform:uppercase; margin-top:4px; }
  table { width:100%; border-collapse:collapse; }
  th { font-size:10px; text-transform:uppercase; color:#555; font-weight:600; padding-bottom:4px; text-align:left; border-bottom:1px solid #000; }
  th:nth-child(3), th:nth-child(4) { text-align:right; }
</style></head><body>

<div class="center">
  <div class="brand">GAMATAURI</div>
  <div class="subtitle">Rua Aiuruoca, 192 - Loja 5 - Fernão Dias</div>
</div>

<div class="divider"></div>
<div class="center" style="font-size:13px;font-weight:700;">COMPROVANTE DO PEDIDO</div>
<div class="divider"></div>

<div style="margin:10px 0;">
  <div class="info-row"><span class="info-label">Pedido:</span><span class="info-value">#${orderNumber}</span></div>
  <div class="info-row"><span class="info-label">Data:</span><span class="info-value">${date}</span></div>
  <div class="info-row"><span class="info-label">Pagamento:</span><span class="info-value">${formatPaymentMethod(data.payment_method)}</span></div>
  ${data.delivery_type === "pickup" 
    ? `<div class="info-row"><span class="info-label">Tipo:</span><span class="info-value">Retirada na Loja</span></div>` 
    : ""}
</div>

${data.customer_name ? `
<div class="divider-light"></div>
<div style="margin:8px 0;">
  <div class="section-label">Cliente</div>
  <div style="font-size:14px;font-weight:600;">${data.customer_name.split(" ")[0]}</div>
</div>` : ""}

${data.customer_address && data.delivery_type !== "pickup" ? `
<div style="margin:4px 0;">
  <div class="section-label">Endereço</div>
  <div style="font-size:12px;">${data.customer_address}</div>
</div>` : ""}

<div class="divider"></div>

<table>
  <thead><tr><th>Qtd</th><th>Item</th><th>Unit.</th><th>Total</th></tr></thead>
  <tbody>${itemsHTML}</tbody>
</table>

<div class="divider"></div>

<div class="summary-row"><span>Subtotal:</span><span>R$ ${subtotal.toFixed(2).replace(".", ",")}</span></div>
${deliveryFee > 0 ? `<div class="summary-row"><span>Frete:</span><span>R$ ${deliveryFee.toFixed(2).replace(".", ",")}</span></div>` : ""}
${discount > 0 ? `<div class="summary-row discount"><span>Desconto:</span><span>- R$ ${discount.toFixed(2).replace(".", ",")}</span></div>` : ""}

<div class="divider-light"></div>
<div class="total-row"><span>Total:</span><span>R$ ${data.total_amount.toFixed(2).replace(".", ",")}</span></div>

${data.change_for ? `
<div class="summary-row"><span>Troco para:</span><span>R$ ${parseFloat(data.change_for).toFixed(2).replace(".", ",")}</span></div>
<div class="summary-row"><span>Troco:</span><span>R$ ${(parseFloat(data.change_for) - data.total_amount).toFixed(2).replace(".", ",")}</span></div>` : ""}

${data.notes ? `<div class="divider-light"></div><div style="background:#f5f5f5;padding:8px;border-radius:4px;font-size:12px;">Obs: ${data.notes}</div>` : ""}

<div class="divider"></div>
<div class="center">
  <div class="footer-msg">Obrigado pela preferência!</div>
  <div class="brand" style="font-size:14px;margin-top:4px;">GAMATAURI</div>
</div>

</body></html>`;
}

export const OrderReceiptModal = ({ isOpen, onClose, orderId, orderNumber }: OrderReceiptModalProps) => {
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [receiptHTML, setReceiptHTML] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const [orderRes, itemsRes] = await Promise.all([
          supabase.from("orders").select("*").eq("id", orderId).single(),
          supabase.from("order_items").select("*").eq("order_id", orderId),
        ]);

        if (orderRes.error) throw orderRes.error;
        if (itemsRes.error) throw itemsRes.error;

        const data: OrderData = {
          ...orderRes.data,
          items: itemsRes.data || [],
        };

        setOrderData(data);
        setReceiptHTML(generateReceiptHTML(data, orderNumber));
      } catch (err) {
        console.error("Error fetching order for receipt:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [isOpen, orderId, orderNumber]);

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;

    setDownloading(true);
    try {
      const body = iframe.contentDocument.body;
      const canvas = await html2canvas(body, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: body.scrollWidth,
        height: body.scrollHeight,
      });

      const imgWidth = 80; // mm (thermal receipt width)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF({ unit: "mm", format: [imgWidth, imgHeight + 4] });
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 2, imgWidth, imgHeight);
      pdf.save(`comprovante-${orderNumber}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-base font-bold">
            Comprovante #{orderNumber}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto bg-muted/30 p-3">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <iframe
                  ref={iframeRef}
                  srcDoc={receiptHTML}
                  className="w-full border-0"
                  style={{ height: "500px" }}
                  title="Pré-visualização do comprovante"
                />
              </div>
            </div>

            <div className="p-4 border-t bg-card">
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full h-12 text-base font-semibold gap-2"
              >
                {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {downloading ? "Gerando PDF..." : "Baixar Comprovante (PDF)"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
