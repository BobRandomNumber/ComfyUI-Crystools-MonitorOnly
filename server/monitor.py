from server import PromptServer
from aiohttp import web
from ..core import logger
from ..general import cmonitor
import os

@PromptServer.instance.routes.post("/crysmonitor/monitor")
async def newSettings(request):
    settings = await request.json()
    
    if 'rate' in settings:
        cmonitor.rate = settings['rate']
        if cmonitor.rate > 0:
            cmonitor.startMonitor()

    if 'switchCPU' in settings:
        cmonitor.hardwareInfo.switchCPU = settings['switchCPU']

    if 'switchHDD' in settings:
        cmonitor.hardwareInfo.switchHDD = settings['switchHDD']

    if 'switchRAM' in settings:
        cmonitor.hardwareInfo.switchRAM = settings['switchRAM']

    if 'whichHDD' in settings:
        cmonitor.hardwareInfo.whichHDD = settings['whichHDD']

    return web.Response(status=200)

@PromptServer.instance.routes.post("/crysmonitor/monitor/switch")
async def monitorSwitch(request):
    try:
        switch = await request.json()

        if 'monitor' in switch:
            monitor = switch['monitor']
            if type(monitor) is not bool:
                raise Exception('monitor must be a boolean.')

            if monitor:
                cmonitor.startMonitor()
            else:
                cmonitor.stopMonitor()

        return web.Response(status=200)
    except Exception as e:
        logger.error(e)
        return web.Response(status=400, text=str(e))

@PromptServer.instance.routes.get("/crysmonitor/monitor/HDD")
async def getHDDs(request):
    return web.json_response(cmonitor.hardwareInfo.getHDDsInfo())

@PromptServer.instance.routes.get("/crysmonitor/monitor/GPU")
async def getGPUs(request):
    gpuInfo = cmonitor.hardwareInfo.getGPUInfo()
    return web.json_response(gpuInfo)

@PromptServer.instance.routes.post("/crysmonitor/monitor/GPU/{index}")
async def updateGPU(request):
  index = request.match_info["index"]
  settings = await request.json()
  if 'utilization' in settings:
      cmonitor.hardwareInfo.GPUInfo.gpusUtilization[int(index)] = settings['utilization']

  if 'vram' in settings:
      cmonitor.hardwareInfo.GPUInfo.gpusVRAM[int(index)] = settings['vram']

  if 'temperature' in settings:
      cmonitor.hardwareInfo.GPUInfo.gpusTemperature[int(index)] = settings['temperature']

  return web.Response(status=200)

@PromptServer.instance.routes.get("/crysmonitor/folder_name")
def get_folder_name(request):
    folder_path = os.path.dirname(os.path.dirname(__file__))
    folder_name = os.path.basename(folder_path)
    return web.json_response(folder_name)
