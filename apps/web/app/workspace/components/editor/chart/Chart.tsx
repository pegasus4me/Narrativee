"use client";

import { useEffect, useState } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  title?: string;
  xField?: string;
  yField?: string;
  data?: any[];
}

interface ChartProps {
  config: ChartConfig;
  csvData?: any[];
}

export default function Chart({ config, csvData }: ChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  console.log('🎨 Chart component rendering with config:', config);

  // Add validation
  if (!config) {
    console.error('❌ No config provided to Chart component');
    return (
      <div className="my-6 p-8 bg-red-50 border-2 border-red-200 rounded-lg text-center">
        <p className="text-red-600 font-medium">Chart Error</p>
        <p className="text-sm text-red-500 mt-1">No chart configuration provided</p>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="my-6 p-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-600 font-medium">Loading chart...</p>
      </div>
    );
  }

  const { type, title, xField, yField, data: configData } = config;
  console.log('📈 Chart type:', type, 'xField:', xField, 'yField:', yField, 'data rows:', configData?.length);

  // Use provided data or csvData
  const rawData = configData || csvData || [];

  if (rawData.length === 0) {
    return (
      <div className="my-6 p-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-600 font-medium">{title || 'Chart'}</p>
        <p className="text-sm text-gray-500 mt-1">No data available</p>
      </div>
    );
  }

  // Transform data for different chart types
  const prepareData = () => {
    if (!xField || !yField) {
      return null;
    }

    switch (type) {
      case 'line':
        // Sort data by x-axis value (ascending order)
        const sortedLineData = [...rawData].sort((a, b) => {
          const aVal = a[xField];
          const bVal = b[xField];

          // If numeric, sort numerically
          if (!isNaN(aVal) && !isNaN(bVal)) {
            return parseFloat(aVal) - parseFloat(bVal);
          }
          // Otherwise, sort alphabetically
          return String(aVal).localeCompare(String(bVal));
        });

        return [
          {
            id: title || 'data',
            data: sortedLineData.map((row: any) => ({
              x: row[xField],
              y: parseFloat(row[yField]) || 0,
            })),
          },
        ] as any;

      case 'bar':
        return rawData.map((row: any) => ({
          [xField]: row[xField],
          [yField]: parseFloat(row[yField]) || 0,
        }));

      case 'pie':
        return rawData.map((row: any, index: number) => ({
          id: `${row[xField]}-${index}`, // Use index to ensure unique keys
          label: row[xField],
          value: parseFloat(row[yField]) || 0,
        }));

      case 'scatter':
        return [
          {
            id: title || 'data',
            data: rawData.map((row: any) => ({
              x: parseFloat(row[xField]) || 0,
              y: parseFloat(row[yField]) || 0,
            })),
          },
        ];

      default:
        return null;
    }
  };

  const chartData = prepareData();

  if (!chartData) {
    return (
      <div className="my-6 p-8 bg-amber-50 border-2 border-amber-800 rounded-lg text-center ">
        <p className="text-amber-800 font-medium">{title || 'Chart'}</p>
        <p className="text-sm text-amber-600 mt-1">Missing chart configuration (xField or yField)</p>
      </div>
    );
  }

  return (
    <div className="my-8">
      {title && (
        <h4 className="text-xl font-semibold text-gray-900 mb-4 text-center" style={{ fontFamily: 'var(--font-petrona)' }}>{title}</h4>
      )}
      <div style={{ height: '500px' }} className="bg-white p-6 rounded-lg border border-gray-200">
        {type === 'line' && (
          <ResponsiveLine
            data={chartData}
            margin={{ top: 20, right: 110, bottom: 60, left: 60 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto', reverse: false }}
            axisBottom={{
              tickRotation: -45,
              legend: xField,
              legendOffset: 50,
              legendPosition: 'middle'
            }}
            axisLeft={{
              legend: yField,
              legendOffset: -50,
              legendPosition: 'middle'
            }}
            colors={{ scheme: 'category10' }}
            pointSize={10}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            enableArea={true}
            areaOpacity={0.1}
            useMesh={true}
            enableCrosshair={true}
            crosshairType="cross"
            legends={[
              {
                anchor: 'top',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemBackground: 'rgba(0, 0, 0, .03)',
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            tooltip={({ point }) => (
              <div className="bg-white px-3 py-2 rounded shadow-lg border border-gray-200">
                <strong className="text-gray-900">{point.seriesId}</strong>
                <div className="text-sm text-gray-600">
                  <span>{xField}: </span>
                  <span className="font-medium">{point.data.xFormatted}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span>{yField}: </span>
                  <span className="font-medium">{point.data.yFormatted}</span>
                </div>
              </div>
            )}
            theme={{
              axis: {
                ticks: {
                  text: { fontSize: 11 }
                }
              },
              crosshair: {
                line: {
                  stroke: '#000',
                  strokeWidth: 1,
                  strokeOpacity: 0.35,
                  strokeDasharray: '6 6'
                }
              }
            }}
          />
        )}

        {type === 'bar' && (
          <ResponsiveBar
            data={chartData}
            keys={[yField || 'value']}
            indexBy={xField || 'label'}
            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            colors={{ scheme: 'nivo' }}
            axisBottom={{
              tickRotation: -45,
              legend: xField,
              legendOffset: 50,
              legendPosition: 'middle'
            }}
            axisLeft={{
              legend: yField,
              legendOffset: -50,
              legendPosition: 'middle'
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            enableLabel={true}
            tooltip={({ id, value, indexValue, color }) => (
              <div className="bg-white px-3 py-2 w-md rounded-md shadow-xs border">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                  <strong className="text-gray-900">{indexValue}</strong>
                </div>
                <div className="text-sm text-gray-600">
                  <span>{yField}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              </div>
            )}
            theme={{
              axis: {
                ticks: {
                  text: { fontSize: 11 }
                }
              }
            }}
            animate={false}
          />
        )}

        {type === 'pie' && (
          <ResponsivePie
            data={chartData}
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={{ scheme: 'nivo' }}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
            tooltip={({ datum }) => (
              <div className="bg-white px-3 py-2 w-md rounded-md shadow-xs border">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: datum.color }}></div>
                  <strong className="text-gray-900">{datum.label}</strong>
                </div>
                <div className="text-sm text-gray-600">
                  <span>Value: </span>
                  <span className="font-medium">{datum.value}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {datum.formattedValue} of total
                </div>
              </div>
            )}
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: 56,
                itemsSpacing: 0,
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: '#999',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: 'circle',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemTextColor: '#000'
                    }
                  }
                ]
              }
            ]}
            theme={{
              labels: {
                text: { fontSize: 12, fontWeight: 600 }
              }
            }}
            animate={false}
          />
        )}

        {type === 'scatter' && (
          <ResponsiveScatterPlot
            data={chartData}
            margin={{ top: 20, right: 110, bottom: 60, left: 60 }}
            xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            axisBottom={{
              legend: xField,
              legendOffset: 46,
              legendPosition: 'middle'
            }}
            axisLeft={{
              legend: yField,
              legendOffset: -50,
              legendPosition: 'middle'
            }}
            colors={{ scheme: 'category10' }}
            nodeSize={12}
            useMesh={true}
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemBackground: 'rgba(0, 0, 0, .03)',
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            tooltip={({ node }) => (
              <div className="bg-white px-3 py-2 w-md rounded-md shadow-xs border">
                <strong className="text-gray-900">{node.serieId}</strong>
                <div className="text-sm text-gray-600">
                  <span>{xField}: </span>
                  <span className="font-medium">{String(node.data.x)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span>{yField}: </span>
                  <span className="font-medium">{String(node.data.y)}</span>
                </div>
              </div>
            )}
            theme={{
              axis: {
                ticks: {
                  text: { fontSize: 11 }
                }
              }
            }}
            animate={false}
          />
        )}
      </div>
    </div>
  );
}
