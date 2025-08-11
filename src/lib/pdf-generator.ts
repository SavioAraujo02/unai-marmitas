// src/lib/pdf-generator.ts
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Fechamento, Consumo, Empresa } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

// Estender o tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface RelatorioData {
  empresa: Empresa
  fechamento: Fechamento
  consumos: Consumo[]
  periodo: { mes: number; ano: number }
}

export class PDFGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number

  constructor() {
    this.doc = new jsPDF()
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 20
  }

  // Gerar relatório mensal para empresa
  async gerarRelatorioMensal(data: RelatorioData): Promise<Blob> {
    this.doc = new jsPDF()
    
    // Cabeçalho
    this.adicionarCabecalho(data)
    
    // Informações da empresa
    this.adicionarInformacoesEmpresa(data.empresa)
    
    // Resumo do período
    this.adicionarResumoMensal(data.fechamento, data.periodo)
    
    // Tabela de consumos detalhados
    this.adicionarTabelaConsumos(data.consumos)
    
    // Resumo por tamanho
    this.adicionarResumoTamanhos(data.fechamento)
    
    // Rodapé
    this.adicionarRodape()
    
    return this.doc.output('blob')
  }

  // Gerar relatório consolidado (todas as empresas)
  async gerarRelatorioConsolidado(
    fechamentos: Fechamento[], 
    periodo: { mes: number; ano: number }
  ): Promise<Blob> {
    this.doc = new jsPDF()
    
    // Cabeçalho consolidado
    this.adicionarCabecalhoConsolidado(periodo)
    
    // Resumo geral
    this.adicionarResumoGeral(fechamentos)
    
    // Tabela de empresas
    this.adicionarTabelaEmpresas(fechamentos)
    
    // Gráfico de distribuição (texto)
    this.adicionarDistribuicaoTamanhos(fechamentos)
    
    // Rodapé
    this.adicionarRodape()
    
    return this.doc.output('blob')
  }

  private adicionarCabecalho(data: RelatorioData) {
    const y = 30
    
    // Logo/Nome da empresa (simulado)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(255, 193, 7) // Amarelo
    this.doc.text('🍱 UNAÍ MARMITAS', this.margin, y)
    
    // Subtítulo
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(100, 100, 100)
    this.doc.text('Sistema de Gestão de Marmitas Empresariais', this.margin, y + 8)
    
    // Título do relatório
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('RELATÓRIO MENSAL DE CONSUMO', this.margin, y + 25)
    
    // Data do relatório
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(100, 100, 100)
    const dataAtual = new Date().toLocaleDateString('pt-BR')
    this.doc.text(`Gerado em: ${dataAtual}`, this.pageWidth - 60, y + 5)
    
    // Linha separadora
    this.doc.setDrawColor(255, 193, 7)
    this.doc.setLineWidth(2)
    this.doc.line(this.margin, y + 35, this.pageWidth - this.margin, y + 35)
  }

  private adicionarCabecalhoConsolidado(periodo: { mes: number; ano: number }) {
    const y = 30
    
    // Logo/Nome da empresa
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(255, 193, 7)
    this.doc.text('🍱 UNAÍ MARMITAS', this.margin, y)
    
    // Título do relatório
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('RELATÓRIO CONSOLIDADO MENSAL', this.margin, y + 25)
    
    // Período
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    this.doc.setFontSize(14)
    this.doc.text(`${meses[periodo.mes - 1]} de ${periodo.ano}`, this.margin, y + 40)
    
    // Linha separadora
    this.doc.setDrawColor(255, 193, 7)
    this.doc.setLineWidth(2)
    this.doc.line(this.margin, y + 50, this.pageWidth - this.margin, y + 50)
  }

  private adicionarInformacoesEmpresa(empresa: Empresa) {
    let y = 90
    
    // Título da seção
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(0, 0, 0)
    this.doc.text('DADOS DA EMPRESA', this.margin, y)
    
    y += 15
    
    // Informações da empresa
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    
    const infos = [
      `Empresa: ${empresa.nome}`,
      `Responsável: ${empresa.responsavel}`,
      `CNPJ: ${empresa.cnpj || 'Não informado'}`,
      `Contato: ${empresa.contato || 'Não informado'}`,
      `Email: ${empresa.email || 'Não informado'}`,
      `Forma de Pagamento: ${empresa.forma_pagamento.toUpperCase()}`,
    ]
    
    if (empresa.desconto_percentual > 0) {
      infos.push(`Desconto Aplicado: ${empresa.desconto_percentual}%`)
    }
    
    infos.forEach((info, index) => {
      this.doc.text(info, this.margin, y + (index * 6))
    })
  }

  private adicionarResumoMensal(fechamento: Fechamento, periodo: { mes: number; ano: number }) {
    let y = 180
    
    // Título da seção
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('RESUMO DO PERÍODO', this.margin, y)
    
    y += 15
    
    // Caixa de resumo
    this.doc.setDrawColor(200, 200, 200)
    this.doc.setFillColor(248, 249, 250)
    this.doc.rect(this.margin, y, this.pageWidth - (this.margin * 2), 40, 'FD')
    
    // Dados do resumo
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    
    const col1X = this.margin + 10
    const col2X = this.pageWidth / 2
    
    // Coluna 1
    this.doc.text('QUANTIDADE DE MARMITAS:', col1X, y + 12)
    this.doc.text(`Pequenas (P): ${fechamento.total_p}`, col1X, y + 20)
    this.doc.text(`Médias (M): ${fechamento.total_m}`, col1X, y + 28)
    this.doc.text(`Grandes (G): ${fechamento.total_g}`, col1X, y + 36)
    
    // Coluna 2
    const totalMarmitas = fechamento.total_p + fechamento.total_m + fechamento.total_g
    this.doc.text('VALORES:', col2X, y + 12)
    this.doc.text(`Total de Marmitas: ${totalMarmitas}`, col2X, y + 20)
    this.doc.text(`Valor Total: ${formatCurrency(fechamento.valor_total)}`, col2X, y + 28)
    this.doc.text(`Valor Médio: ${formatCurrency(fechamento.valor_total / totalMarmitas)}`, col2X, y + 36)
  }

  private adicionarTabelaConsumos(consumos: Consumo[]) {
    let y = 240
    
    // Título da seção
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('DETALHAMENTO DIÁRIO', this.margin, y)
    
    y += 10
    
    // Agrupar consumos por data
    const consumosPorData = consumos.reduce((acc, consumo) => {
      const data = consumo.data_consumo
      if (!acc[data]) {
        acc[data] = []
      }
      acc[data].push(consumo)
      return acc
    }, {} as Record<string, Consumo[]>)
    
    // Preparar dados para a tabela
    const tableData = Object.entries(consumosPorData).map(([data, consumosData]) => {
      const totalP = consumosData.filter(c => c.tamanho === 'P').reduce((sum, c) => sum + c.quantidade, 0)
      const totalM = consumosData.filter(c => c.tamanho === 'M').reduce((sum, c) => sum + c.quantidade, 0)
      const totalG = consumosData.filter(c => c.tamanho === 'G').reduce((sum, c) => sum + c.quantidade, 0)
      const valorTotal = consumosData.reduce((sum, c) => sum + c.preco, 0)
      
      return [
        formatDate(data),
        totalP.toString(),
        totalM.toString(),
        totalG.toString(),
        (totalP + totalM + totalG).toString(),
        formatCurrency(valorTotal)
      ]
    })
    
    // Gerar tabela
    this.doc.autoTable({
      startY: y,
      head: [['Data', 'P', 'M', 'G', 'Total', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 193, 7],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 30, halign: 'right' }
      }
    })
  }

  private adicionarResumoTamanhos(fechamento: Fechamento) {
    const finalY = (this.doc as any).lastAutoTable.finalY + 20
    
    // Título da seção
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('DISTRIBUIÇÃO POR TAMANHO', this.margin, finalY)
    
    const totalMarmitas = fechamento.total_p + fechamento.total_m + fechamento.total_g
    
    if (totalMarmitas > 0) {
      const percP = ((fechamento.total_p / totalMarmitas) * 100).toFixed(1)
      const percM = ((fechamento.total_m / totalMarmitas) * 100).toFixed(1)
      const percG = ((fechamento.total_g / totalMarmitas) * 100).toFixed(1)
      
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'normal')
      
      const y = finalY + 15
      this.doc.text(`• Pequenas (P): ${fechamento.total_p} unidades (${percP}%)`, this.margin, y)
      this.doc.text(`• Médias (M): ${fechamento.total_m} unidades (${percM}%)`, this.margin, y + 8)
      this.doc.text(`• Grandes (G): ${fechamento.total_g} unidades (${percG}%)`, this.margin, y + 16)
    }
  }

  private adicionarResumoGeral(fechamentos: Fechamento[]) {
    let y = 90
    
    // Calcular totais
    const totalEmpresas = fechamentos.length
    const totalMarmitas = fechamentos.reduce((sum, f) => sum + f.total_p + f.total_m + f.total_g, 0)
    const totalFaturamento = fechamentos.reduce((sum, f) => sum + f.valor_total, 0)
    const ticketMedio = totalMarmitas > 0 ? totalFaturamento / totalMarmitas : 0
    
    // Caixa de resumo
    this.doc.setDrawColor(200, 200, 200)
    this.doc.setFillColor(248, 249, 250)
    this.doc.rect(this.margin, y, this.pageWidth - (this.margin * 2), 50, 'FD')
    
    // Título
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('RESUMO GERAL DO MÊS', this.margin + 10, y + 12)
    
    // Dados do resumo
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    
    const col1X = this.margin + 10
    const col2X = this.pageWidth / 2
    
    // Coluna 1
    this.doc.text(`Empresas Atendidas: ${totalEmpresas}`, col1X, y + 25)
    this.doc.text(`Total de Marmitas: ${totalMarmitas}`, col1X, y + 33)
    
    // Coluna 2
    this.doc.text(`Faturamento Total: ${formatCurrency(totalFaturamento)}`, col2X, y + 25)
    this.doc.text(`Ticket Médio: ${formatCurrency(ticketMedio)}`, col2X, y + 33)
  }

  private adicionarTabelaEmpresas(fechamentos: Fechamento[]) {
    const y = 160
    
    // Título da seção
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('DETALHAMENTO POR EMPRESA', this.margin, y)
    
    // Preparar dados para a tabela
    const tableData = fechamentos.map((fechamento, index) => {
      const totalMarmitas = fechamento.total_p + fechamento.total_m + fechamento.total_g
      return [
        (index + 1).toString(),
        fechamento.empresa?.nome || 'Empresa não encontrada',
        fechamento.total_p.toString(),
        fechamento.total_m.toString(),
        fechamento.total_g.toString(),
        totalMarmitas.toString(),
        formatCurrency(fechamento.valor_total)
      ]
    })
    
    // Adicionar linha de totais
    const totais = fechamentos.reduce((acc, f) => ({
      p: acc.p + f.total_p,
      m: acc.m + f.total_m,
      g: acc.g + f.total_g,
      valor: acc.valor + f.valor_total
    }), { p: 0, m: 0, g: 0, valor: 0 })
    
    tableData.push([
      '',
      'TOTAL GERAL',
      totais.p.toString(),
      totais.m.toString(),
      totais.g.toString(),
      (totais.p + totais.m + totais.g).toString(),
      formatCurrency(totais.valor)
    ])
    
    // Gerar tabela
    this.doc.autoTable({
      startY: y + 10,
      head: [['#', 'Empresa', 'P', 'M', 'G', 'Total', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 193, 7],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 25, halign: 'right' }
      },
      didParseCell: (data: any) => {
        // Destacar linha de totais
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 240, 240]
        }
      }
    })
  }

  private adicionarDistribuicaoTamanhos(fechamentos: Fechamento[]) {
    const finalY = (this.doc as any).lastAutoTable.finalY + 20
    
    // Calcular distribuição
    const totais = fechamentos.reduce((acc, f) => ({
      p: acc.p + f.total_p,
      m: acc.m + f.total_m,
      g: acc.g + f.total_g
    }), { p: 0, m: 0, g: 0 })
    
    const totalGeral = totais.p + totais.m + totais.g
    
    if (totalGeral > 0) {
      // Título da seção
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('DISTRIBUIÇÃO GERAL POR TAMANHO', this.margin, finalY)
      
      const percP = ((totais.p / totalGeral) * 100).toFixed(1)
      const percM = ((totais.m / totalGeral) * 100).toFixed(1)
      const percG = ((totais.g / totalGeral) * 100).toFixed(1)
      
      this.doc.setFontSize(11)
      this.doc.setFont('helvetica', 'normal')
      
      const y = finalY + 15
      this.doc.text(`• Pequenas (P): ${totais.p} unidades (${percP}%)`, this.margin, y)
      this.doc.text(`• Médias (M): ${totais.m} unidades (${percM}%)`, this.margin, y + 8)
      this.doc.text(`• Grandes (G): ${totais.g} unidades (${percG}%)`, this.margin, y + 16)
      
      // Gráfico simples em texto
      this.doc.setFontSize(10)
      this.doc.text('Distribuição Visual:', this.margin, y + 30)
      
      const barWidth = 100
      const barP = (totais.p / totalGeral) * barWidth
      const barM = (totais.m / totalGeral) * barWidth
      const barG = (totais.g / totalGeral) * barWidth
      
      // Barras coloridas (simuladas com retângulos)
      this.doc.setFillColor(59, 130, 246) // Azul para P
      this.doc.rect(this.margin, y + 35, barP, 5, 'F')
      
      this.doc.setFillColor(34, 197, 94) // Verde para M
      this.doc.rect(this.margin + barP, y + 35, barM, 5, 'F')
      
      this.doc.setFillColor(249, 115, 22) // Laranja para G
      this.doc.rect(this.margin + barP + barM, y + 35, barG, 5, 'F')
    }
  }

  private adicionarRodape() {
    const y = this.pageHeight - 30
    
    // Linha separadora
    this.doc.setDrawColor(200, 200, 200)
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, y - 10, this.pageWidth - this.margin, y - 10)
    
    // Informações do rodapé
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(100, 100, 100)
    
    // Lado esquerdo
    this.doc.text('🍱 Unaí Marmitas - Sistema de Gestão', this.margin, y)
    this.doc.text('Relatório gerado automaticamente pelo sistema', this.margin, y + 5)
    
    // Lado direito
    const dataHora = new Date().toLocaleString('pt-BR')
    this.doc.text(`Gerado em: ${dataHora}`, this.pageWidth - 80, y)
    this.doc.text(`Página 1`, this.pageWidth - 30, y + 5)
  }

  // Método para download direto
  downloadPDF(filename: string) {
    this.doc.save(filename)
  }
}